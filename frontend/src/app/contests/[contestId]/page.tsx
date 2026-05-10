'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store/store';
import { contestAPI, type ContestDetail, type LeaderboardEntry } from '@/app/utils/contestAPI';
import Footer from '@/app/components/Footer';
import Loader from '@/app/components/TruckLoader';

function formatDate(s: string) {
  return new Date(s).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function ContestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params?.contestId as string;
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  const [contest, setContest] = useState<ContestDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !contestId) {
      if (!isAuthenticated && isInitialized) router.push('/accounts/login');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      contestAPI.get(contestId),
      contestAPI.leaderboard(contestId, { limit: 20 }),
    ])
      .then(([detailRes, lbRes]) => {
        setContest(detailRes.contest);
        setLeaderboard(lbRes.leaderboard || []);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load contest'))
      .finally(() => setLoading(false));
  }, [contestId, isAuthenticated, isInitialized, router]);

  const handleRegister = () => {
    if (!contestId || registering) return;
    setRegistering(true);
    contestAPI
      .register(contestId)
      .then(() => {
        return contestAPI.get(contestId);
      })
      .then((res) => setContest(res.contest))
      .catch((err) => setError(err.response?.data?.error || 'Registration failed'))
      .finally(() => setRegistering(false));
  };

  if (!isInitialized || !isAuthenticated) {
    return (
      <Loader fullPage message="Loading..." submessage="Checking access..." />
    );
  }

  if (loading && !contest) {
    return (
      <Loader fullPage message="Loading contest" submessage="Fetching contest details..." />
    );
  }

  if (error && !contest) {
    return (
      <div className="min-h-screen bg-primary">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="rounded-lg border border-error/50 bg-error/10 px-4 py-3 text-error">{error}</div>
          <Link href="/contests" className="mt-4 inline-block text-brand hover:underline">← Back to contests</Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (!contest) {
    return null;
  }

  const canEnter = contest.registered && (contest.status === 'running' || contest.status === 'ended');
  const showRegister = contest.status === 'upcoming' && !contest.registered;

  return (
    <div className="min-h-screen bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/contests" className="text-sm text-brand hover:underline">← Contests</Link>
        </div>

        {error && (
          <div className="rounded-lg border border-error/50 bg-error/10 px-4 py-3 text-sm text-error mb-6">
            {error}
          </div>
        )}

        <div className="mb-8 rounded-2xl border border-border-primary bg-elevated/70 p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">{contest.title}</h1>
              <p className="text-secondary mt-1 max-w-2xl">{contest.description}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-tertiary">
                <span>Start: {formatDate(contest.startTime)}</span>
                <span>End: {formatDate(contest.endTime)}</span>
                <span>Duration: {formatDuration(contest.duration)}</span>
                <span>{contest.participantCount} participants</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-medium capitalize ${
                    contest.status === 'upcoming'
                      ? 'bg-secondary text-primary'
                      : contest.status === 'running'
                        ? 'bg-success/20 text-success'
                        : 'bg-tertiary text-secondary'
                  }`}
                >
                  {contest.status}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {showRegister && (
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={registering}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-inverse hover:opacity-90 disabled:opacity-50"
                >
                  {registering ? 'Registering…' : 'Register'}
                </button>
              )}
              {canEnter && contest.status === 'running' && (
                <span className="rounded-lg border border-success bg-success/10 px-4 py-2 text-sm font-medium text-success">
                  You are registered
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-border-primary bg-elevated p-6">
          <h2 className="text-lg font-semibold text-primary mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How the contest works
          </h2>
          <ul className="space-y-3 text-sm text-secondary">
            <li className="flex items-start">
              <span className="text-brand font-medium mr-2">Scoring:</span>
              Each problem has a point value (shown next to the problem). You get that many points when you solve it correctly. Defaults: Easy = 1 pt, Medium = 2 pts, Hard = 3 pts (admins can set custom scores).
            </li>
            <li className="flex items-start">
              <span className="text-brand font-medium mr-2">Penalty:</span>
              For each wrong submission on a problem before your first correct answer, <strong>5 minutes</strong> are added to your total penalty. Correct submissions do not add penalty.
            </li>
            <li className="flex items-start">
              <span className="text-brand font-medium mr-2">Ranking:</span>
              Leaderboard is sorted by <strong>total score (highest first)</strong>, then by <strong>total penalty (lowest first)</strong>. So more points beat fewer; with the same score, lower penalty wins.
            </li>
            <li className="flex items-start">
              <span className="text-brand font-medium mr-2">How to get maximum points:</span>
              Solve all problems and minimize wrong submissions. Read the problem carefully, test with examples, then submit. Every wrong attempt costs 5 minutes of penalty.
            </li>
            <li className="flex items-start">
              <span className="text-brand font-medium mr-2">After the contest:</span>
              All contest problems become available on the normal Problems page so you can practice anytime.
            </li>
          </ul>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">Problems</h2>
            {contest.problems.length === 0 ? (
              <p className="text-secondary text-sm">No problems in this contest.</p>
            ) : (
              <ul className="space-y-2 rounded-xl border border-border-primary bg-elevated p-4">
                {contest.problems.map((p, idx) => {
                  const isUpcoming = contest.status === 'upcoming';
                  const order = 'order' in p ? p.order : idx + 1;
                  const hasDetails = !isUpcoming && p._id && (p.title != null || p.slug);
                  const href =
                    contest.status === 'ended' && p.slug
                      ? `/problems/${p.slug}/description`
                      : contest.status === 'running' && p._id
                        ? `/contests/${contestId}/problem/${p._id}/description`
                        : '#';
                  return (
                    <li key={isUpcoming ? `q-${order}` : p._id}>
                      <Link
                        href={href}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                          hasDetails ? 'hover:bg-secondary text-primary' : 'text-tertiary cursor-default pointer-events-none'
                        }`}
                      >
                        <span className="font-medium">
                          {isUpcoming ? `Q${order}` : `Q${order}. ${p.title ?? 'Problem'}`}
                        </span>
                        {hasDetails && p.difficulty != null && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs capitalize ${
                              p.difficulty === 'easy'
                                ? 'bg-success/20 text-success'
                                : p.difficulty === 'medium'
                                  ? 'bg-warning/20 text-warning'
                                  : 'bg-error/20 text-error'
                            }`}
                          >
                            {p.difficulty}
                            {p.score != null && ` · ${p.score} pt${p.score !== 1 ? 's' : ''}`}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-3">Leaderboard</h2>
            <div className="overflow-hidden rounded-xl border border-border-primary bg-elevated">
              {leaderboard.length === 0 ? (
                <p className="p-4 text-sm text-secondary">No submissions yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-primary bg-secondary/50">
                      <th className="px-3 py-2 text-left font-medium text-primary">Rank</th>
                      <th className="px-3 py-2 text-left font-medium text-primary">User</th>
                      <th className="px-3 py-2 text-right font-medium text-primary">Score</th>
                      <th className="px-3 py-2 text-right font-medium text-primary">Penalty</th>
                      <th className="px-3 py-2 text-right font-medium text-primary">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row) => (
                      <tr key={row.userId} className="border-b border-border-primary/70">
                        <td className="px-3 py-2 font-medium text-primary">{row.rank}</td>
                        <td className="px-3 py-2 text-primary">{row.username}</td>
                        <td className="px-3 py-2 text-right text-primary">{row.score}</td>
                        <td className="px-3 py-2 text-right text-secondary">{row.penalty} min</td>
                        <td className="px-3 py-2 text-right text-secondary">
                          {row.totalTimeMinutes.toFixed(0)} min
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
