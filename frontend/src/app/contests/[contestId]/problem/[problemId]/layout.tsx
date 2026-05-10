'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ContestProblemProvider, useContestProblem } from './ContestProblemContext';
import ContestNavbar from './utils/ContestNavbar';
import ContestProblemSection from './utils/ContestProblemSection';
import ContestCodeEditorSection from './utils/ContestCodeEditorSection';
import ContestTestCasesSection from './utils/ContestTestCasesSection';
import ContestFooter from './utils/ContestFooter';
import Loader from '@/app/components/TruckLoader';
import type { SubmissionResponse, TestCaseDetail } from '@/app/problems/[slug]/utils/types';

declare global {
  interface Window {
    testCasesData?: { input: string; expectedOutput: string; isCustom?: boolean }[];
    codeEditorData?: { code: string; language: string };
    testResults?: unknown[];
    runSummary?: { passedTests: number; totalTests: number } | null;
    submissionResult?: SubmissionResponse;
    submissionTabName?: string;
  }
}

function ContestProblemLayoutInner({ children }: { children: React.ReactNode }) {
  const { data, loading, error, contestId } = useContestProblem();
  const router = useRouter();
  const [showSubmissionOverlay, setShowSubmissionOverlay] = useState(false);

  useEffect(() => {
    const handleCreateSubmissionTab = () => setShowSubmissionOverlay(true);
    const handleCloseSubmissionOverlay = () => setShowSubmissionOverlay(false);
    window.addEventListener('createSubmissionTab', handleCreateSubmissionTab);
    window.addEventListener('closeSubmissionOverlay', handleCloseSubmissionOverlay);
    return () => {
      window.removeEventListener('createSubmissionTab', handleCreateSubmissionTab);
      window.removeEventListener('closeSubmissionOverlay', handleCloseSubmissionOverlay);
    };
  }, []);

  if (loading && !data) {
    return (
      <Loader
        fullPage
        message="Loading problem"
        submessage="Fetching contest problem..."
      />
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <p className="text-error mb-4">{error}</p>
        <button
          type="button"
          onClick={() => router.push(`/contests/${contestId}`)}
          className="text-brand hover:underline"
        >
          ← Back to contest
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="h-screen flex flex-col relative" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <ContestNavbar />
      <div className="flex-1 overflow-hidden relative">
        <PanelGroup direction="horizontal" className="h-full">
          <Panel
            defaultSize={45}
            minSize={25}
            maxSize={70}
            className="relative flex flex-col"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div className="flex-shrink-0">
              <ContestProblemSection />
            </div>
            <div className="flex-1 overflow-auto relative">
              <div className={showSubmissionOverlay ? 'hidden' : 'h-full'}>
                {children}
              </div>
              {showSubmissionOverlay && (
                <div
                  className="absolute inset-0 z-10 overflow-auto animate-fade-in"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {window.submissionTabName || 'Submission Result'}
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSubmissionOverlay(false);
                          window.dispatchEvent(new CustomEvent('closeSubmissionOverlay'));
                        }}
                        className="p-1 rounded-md hover:bg-secondary"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <SubmissionResultContent />
                  </div>
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <ContestFooter />
            </div>
          </Panel>
          <PanelResizeHandle
            className="w-2 transition-colors duration-200 relative group"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div
              className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 rounded-full"
              style={{ backgroundColor: 'var(--border-secondary)' }}
            />
          </PanelResizeHandle>
          <Panel defaultSize={55} minSize={30} style={{ backgroundColor: 'var(--bg-primary)' }}>
            <PanelGroup direction="vertical" className="h-full">
              <Panel defaultSize={65} minSize={30} style={{ backgroundColor: 'var(--bg-primary)' }}>
                <ContestCodeEditorSection />
              </Panel>
              <PanelResizeHandle
                className="h-2 relative"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              />
              <Panel
                defaultSize={35}
                minSize={15}
                className="border-t"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}
              >
                <ContestTestCasesSection />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

function SubmissionResultContent() {
  const [submissionData, setSubmissionData] = useState<SubmissionResponse | null>(null);
  useEffect(() => {
    const d = window.submissionResult;
    if (d) setSubmissionData(d);
  }, []);
  if (!submissionData) {
    return (
      <div className="animate-pulse">
        <div className="skeleton h-4 rounded w-1/4 mb-4" />
        <div className="skeleton h-4 rounded w-1/2" />
      </div>
    );
  }
  const { submission, results, success, error, message } = submissionData;
  const isAccepted = submission?.status === 'accepted';
  return (
    <div className="space-y-6">
      <div
        className="border rounded-lg p-4"
        style={{
          backgroundColor: isAccepted ? 'var(--success-50)' : 'var(--error-50)',
          borderColor: isAccepted ? 'var(--success-500)' : 'var(--error-500)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold" style={{ color: isAccepted ? 'var(--success-600)' : 'var(--error-600)' }}>
              {isAccepted ? 'Accepted' : error || 'Wrong Answer'}
            </h3>
            <p className="text-sm" style={{ color: isAccepted ? 'var(--success-600)' : 'var(--error-600)' }}>
              {submission ? `${submission.testCasesPassed || 0} / ${submission.totalTestCases || 0} test cases passed` : message}
            </p>
          </div>
          {submission && (
            <div className="text-right text-sm" style={{ color: 'var(--text-secondary)' }}>
              <div className="font-medium">Runtime: {submission.executionTime || 0} ms</div>
              <div className="font-medium">Memory: {submission.memoryUsage || 0} KB</div>
            </div>
          )}
        </div>
      </div>
      {results?.testDetails && results.testDetails.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Test Cases</h4>
          <div className="space-y-3">
            {results.testDetails.map((testCase: TestCaseDetail, index: number) => (
              <div
                key={index}
                className="border rounded-lg overflow-hidden"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <div
                  className="px-4 py-3 flex justify-between items-center border-b"
                  style={{
                    backgroundColor: testCase.passed ? 'var(--success-50)' : 'var(--error-50)',
                    borderColor: testCase.passed ? 'var(--success-500)' : 'var(--error-500)',
                  }}
                >
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Test Case {index + 1}</span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: testCase.passed ? 'var(--success-100)' : 'var(--error-100)',
                      color: testCase.passed ? 'var(--success-600)' : 'var(--error-600)',
                    }}
                  >
                    {testCase.status}
                  </span>
                </div>
                {testCase.isVisible && (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Input:</label>
                      <pre className="border p-3 rounded-md text-sm overflow-x-auto font-mono" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                        {testCase.input}
                      </pre>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Expected:</label>
                      <pre className="border p-3 rounded-md text-sm overflow-x-auto font-mono" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                        {testCase.expectedOutput}
                      </pre>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Your Output:</label>
                      <pre className="border p-3 rounded-md text-sm overflow-x-auto font-mono" style={{ backgroundColor: testCase.passed ? 'var(--success-50)' : 'var(--error-50)', borderColor: testCase.passed ? 'var(--success-500)' : 'var(--error-500)', color: 'var(--text-primary)' }}>
                        {testCase.actualOutput ?? '—'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContestProblemLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const contestId = params?.contestId as string;
  const problemId = params?.problemId as string;

  if (!contestId || !problemId) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <p className="text-secondary">Invalid contest or problem</p>
      </div>
    );
  }

  return (
    <ContestProblemProvider>
      <ContestProblemLayoutInner>{children}</ContestProblemLayoutInner>
    </ContestProblemProvider>
  );
}
