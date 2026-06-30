'use client';

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store/store';
import { contestAPI } from '@/app/utils/contestAPI';

export interface ContestProblemData {
  problem: Record<string, unknown> & {
    _id?: string;
    title?: string;
    description?: string;
    difficulty?: string;
    constraints?: string[];
    visibleTestCases?: { input?: string; output?: string; explanation?: string; imageUrl?: string }[];
    startCode?: { language: string; initialCode: string }[];
    hints?: string[];
    companies?: string[];
    tags?: string[];
    referenceSolution?: unknown[];
    editorialContent?: unknown;
  };
  contest: { _id: string; title: string; startTime: string; endTime: string; status: string };
  userStatus: { preferredLanguage: string };
  showEditorial: boolean;
}

type ContestProblemContextValue = {
  contestId: string;
  problemId: string;
  data: ContestProblemData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  now: Date;
};

const ContestProblemContext = createContext<ContestProblemContextValue | null>(null);

function computeLiveStatus(contest: { startTime: string; endTime: string }, now: Date): 'upcoming' | 'running' | 'ended' {
  const t = now.getTime();
  if (t < new Date(contest.startTime).getTime()) return 'upcoming';
  if (t < new Date(contest.endTime).getTime()) return 'running';
  return 'ended';
}

export function useContestProblem() {
  const ctx = useContext(ContestProblemContext);
  if (!ctx) throw new Error('useContestProblem must be used within ContestProblemProvider');
  return ctx;
}

export function ContestProblemProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const contestId = params?.contestId as string;
  const problemId = params?.problemId as string;
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);

  const [data, setData] = useState<ContestProblemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const fetchData = useCallback(async () => {
    if (!contestId || !problemId || !isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await contestAPI.getContestProblem(contestId, problemId) as unknown as ContestProblemData & { success?: boolean };
      setData({
        problem: res.problem ?? {},
        contest: res.contest,
        userStatus: res.userStatus ?? { preferredLanguage: 'javascript' },
        showEditorial: res.showEditorial ?? false,
      });
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to load problem');
    } finally {
      setLoading(false);
    }
  }, [contestId, problemId, isAuthenticated]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) {
      if (isInitialized && !isAuthenticated) {
        router.push(`/accounts/login?redirect=${encodeURIComponent(`/contests/${contestId}/problem/${problemId}/description`)}`);
      }
      setLoading(false);
      return;
    }
    if (!contestId || !problemId) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [contestId, problemId, isAuthenticated, isInitialized, router, fetchData]);

  useEffect(() => {
    if (!data) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [data]);

  const liveData = useMemo<ContestProblemData | null>(() => {
    if (!data) return null;
    return { ...data, contest: { ...data.contest, status: computeLiveStatus(data.contest, now) } };
  }, [data, now]);

  const value = useMemo<ContestProblemContextValue>(
    () => ({
      contestId,
      problemId,
      data: liveData,
      loading,
      error,
      refresh: fetchData,
      now,
    }),
    [contestId, problemId, liveData, loading, error, fetchData, now]
  );

  return (
    <ContestProblemContext.Provider value={value}>
      {children}
    </ContestProblemContext.Provider>
  );
}
