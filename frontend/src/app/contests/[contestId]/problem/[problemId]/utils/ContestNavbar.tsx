'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useContestProblem } from '../ContestProblemContext';
import { contestAPI } from '@/app/utils/contestAPI';
import { axiosClient } from '@/app/utils/axiosClient';
import { ThemeToggle } from '@/app/components/themeToggle';
import type { RootState } from '@/app/store/store';
import type { SubmissionResponse } from '@/app/problems/[slug]/utils/types';

export default function ContestNavbar() {
  const { contestId, problemId, data, now } = useContestProblem();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const problem = data?.problem;
  const contest = data?.contest;

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  const timeInfo = (() => {
    if (!contest) return '--';
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    if (contest.status === 'upcoming') {
      const ms = start.getTime() - now.getTime();
      if (ms <= 0) return 'Starts soon';
      const totalSeconds = Math.floor(ms / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      return `Starts in ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    if (contest.status === 'running') {
      const ms = end.getTime() - now.getTime();
      if (ms <= 0) return 'Ending…';
      const totalSeconds = Math.floor(ms / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      return `Time left ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return 'Contest ended';
  })();

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTestCasesFromWindow = (): Array<{ input: string; expectedOutput: string }> => {
    const testCasesData = window.testCasesData;
    if (!testCasesData || !Array.isArray(testCasesData)) return [];
    return testCasesData
      .filter((tc: { isCustom?: boolean }) => tc.isCustom)
      .map((tc: { input?: string; expectedOutput?: string }) => ({ input: tc.input || '', expectedOutput: tc.expectedOutput || '' }));
  };

  const handleRunCode = async () => {
    if (isRunning || isSubmitting || !problem?._id) return;
    const codeData = window.codeEditorData;
    if (!codeData?.code || !codeData?.language) {
      alert('Please write some code before running!');
      return;
    }
    setIsRunning(true);
    window.dispatchEvent(new CustomEvent('switchToResults'));
    try {
      const customTestCases = getTestCasesFromWindow();
      const res = await axiosClient.post(`/api/run/${problem._id}`, {
        code: codeData.code,
        language: codeData.language,
        customTestCases,
      });
      if (res.data.success) {
        window.dispatchEvent(new CustomEvent('testResultsUpdated', { detail: { testResults: res.data.testResults, runSummary: res.data.summary } }));
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; compilationError?: string; message?: string } } };
      window.dispatchEvent(
        new CustomEvent('testResultsUpdated', {
          detail: {
            error: {
              success: false,
              error: e.response?.data?.error || 'Compilation Error',
              compilationError: e.response?.data?.compilationError,
              message: e.response?.data?.error || e.response?.data?.message || 'Run failed',
            },
          },
        })
      );
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (isRunning || isSubmitting || !contestId || !problemId || contest?.status !== 'running') return;
    const codeData = window.codeEditorData;
    if (!codeData?.code || !codeData?.language) {
      alert('Please write some code before submitting!');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await contestAPI.submitContest(contestId, problemId, {
        code: codeData.code,
        language: codeData.language,
        notes: { timeTaken: timerSeconds, text: '' },
      }) as SubmissionResponse & { contest?: { score?: number; penalty?: number } };
      const status = res.submission?.status || 'error';
      const tabName = status === 'accepted' ? 'Accepted' : res.results?.errorMessage || res.error ? 'Compilation Error' : 'Wrong Answer';
      window.submissionResult = res;
      window.submissionTabName = tabName;
      window.dispatchEvent(new CustomEvent('createSubmissionTab', { detail: { tabName } }));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      const errorResult: SubmissionResponse = {
        success: false,
        error: 'Submission Error',
        message: e.response?.data?.error || 'Submission failed',
      };
      window.submissionResult = errorResult;
      window.submissionTabName = 'Submission Error';
      window.dispatchEvent(new CustomEvent('createSubmissionTab', { detail: { tabName: 'Submission Error' } }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isRunning || isSubmitting;

  return (
    <nav
      className="w-full shadow-sm border-b px-6 py-3 flex items-center justify-between"
      style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}
    >
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center space-x-2 interactive">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-500)' }}>
            <span className="font-bold text-sm" style={{ color: 'var(--text-inverse)' }}>TC</span>
          </div>
          <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>TrueCode</span>
        </Link>
        <Link href={`/contests/${contestId}`} className="text-sm text-brand hover:underline">
          ← {contest?.title ?? 'Contest'}
        </Link>
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={handleRunCode}
          disabled={isLoading}
          className={`btn-secondary text-sm font-medium flex items-center space-x-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'interactive'}`}
        >
          {isRunning && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />}
          <span>{isRunning ? 'Running...' : 'Run'}</span>
        </button>
        <button
          type="button"
          onClick={handleSubmitCode}
          disabled={isLoading || contest?.status !== 'running'}
          className={`text-sm font-medium flex items-center space-x-2 ${
            isLoading || contest?.status !== 'running' ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-primary interactive'
          }`}
        >
          {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-inverse" />}
          <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div
          className="flex items-center space-x-2 px-3 py-2 rounded-lg border"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
        >
          <span className="text-xs font-medium text-brand bg-brand/10 border border-brand/40 rounded-full px-3 py-1">
            {timeInfo}
          </span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-2 rounded-lg border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <span className="text-sm font-mono" style={{ color: isTimerRunning ? 'var(--success-500)' : 'var(--text-secondary)' }}>
            {formatTime(timerSeconds)}
          </span>
          {!isTimerRunning ? (
            <button type="button" onClick={() => setIsTimerRunning(true)} className="p-1 rounded" style={{ color: 'var(--success-500)' }} title="Start Timer">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </button>
          ) : (
            <button type="button" onClick={() => setIsTimerRunning(false)} className="p-1 rounded" style={{ color: 'var(--error-500)' }} title="Stop Timer">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h4v12H6zm8 0h4v12h-4z" /></svg>
            </button>
          )}
        </div>
        <ThemeToggle />
        {user?.profilePicture ? (
          <div onClick={() => user?.username && router.push(`/${user.username}`)} className="relative w-8 h-8 rounded-full overflow-hidden cursor-pointer interactive">
            <Image src={user.profilePicture} alt="Profile" fill style={{ objectFit: 'cover' }} />
          </div>
        ) : user?.firstName && user?.lastName ? (
          <div
            onClick={() => user?.username && router.push(`/${user.username}`)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer interactive"
            style={{ backgroundColor: 'var(--text-secondary)', color: 'var(--text-inverse)' }}
          >
            {`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`}
          </div>
        ) : (
          <Link href="/accounts/login" className="btn-secondary text-sm">Login</Link>
        )}
      </div>
    </nav>
  );
}
