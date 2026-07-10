'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Users, Clock, CalendarDays, Info } from 'lucide-react';
import type { RootState } from '@/app/store/store';
import { contestAPI, type ContestDetail, type LeaderboardEntry } from '@/app/utils/contestAPI';
import Footer from '@/app/components/Footer';
import Loader from '@/app/components/TruckLoader';
import { useNow, formatCountdown, getInitials, PodiumRow } from '../_shared';

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
  const now = useNow();

  useEffect(() => {
    if (!isInitialized || !contestId) return;
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
  }, [contestId, isInitialized]);

  const handleRegister = () => {
    if (!isAuthenticated) {
      router.push(`/accounts/login?redirect=${encodeURIComponent(`/contests/${contestId}`)}`);
      return;
    }
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

  if (!isInitialized || (loading && !contest)) {
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
  const podium = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-primary">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        <Link
          href="/contests"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition-colors hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Contests
        </Link>

        {error && (
          <div className="mb-6 rounded-lg border border-error/50 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <motion.div
          className="mb-8 rounded-2xl border border-border-primary bg-elevated/70 p-5 lg:p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    contest.status === 'upcoming'
                      ? 'bg-secondary text-primary'
                      : contest.status === 'running'
                        ? 'bg-success/20 text-success'
                        : 'bg-tertiary text-secondary'
                  }`}
                >
                  {contest.status === 'running' ? '● Live' : contest.status}
                </span>
                {contest.status !== 'ended' && (
                  <span className={`text-xs font-medium ${contest.status === 'running' ? 'text-success' : 'text-brand'}`}>
                    {contest.status === 'running'
                      ? `Ends in ${formatCountdown(contest.endTime, now, 'end')}`
                      : `Starts in ${formatCountdown(contest.startTime, now, 'start')}`}
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-2xl font-bold text-primary">{contest.title}</h1>
              <p className="mt-1 max-w-2xl text-secondary">{contest.description}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-tertiary">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" /> {formatDate(contest.startTime)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {formatDuration(contest.duration)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {contest.participantCount} participants
                </span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
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
        </motion.div>

        <motion.div
          className="mb-8 rounded-xl border border-border-primary bg-elevated p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
        >
          <h2 className="mb-4 flex items-center text-lg font-semibold text-primary">
            <Info className="mr-2 h-5 w-5 text-brand" />
            How the contest works
          </h2>
          <ul className="space-y-3 text-sm text-secondary">
            <li className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-0">
              <span className="shrink-0 font-medium text-brand sm:mr-2">Scoring:</span>
              Each problem has a point value (shown next to the problem). You get that many points when you solve it correctly. Defaults: Easy = 1 pt, Medium = 2 pts, Hard = 3 pts (admins can set custom scores).
            </li>
            <li className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-0">
              <span className="shrink-0 font-medium text-brand sm:mr-2">Penalty:</span>
              For each wrong submission on a problem before your first correct answer, <strong>5 minutes</strong> are added to your total penalty. Correct submissions do not add penalty.
            </li>
            <li className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-0">
              <span className="shrink-0 font-medium text-brand sm:mr-2">Ranking:</span>
              Leaderboard is sorted by <strong>total score (highest first)</strong>, then by <strong>total penalty (lowest first)</strong>. So more points beat fewer; with the same score, lower penalty wins.
            </li>
            <li className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-0">
              <span className="shrink-0 font-medium text-brand sm:mr-2">How to get maximum points:</span>
              Solve all problems and minimize wrong submissions. Read the problem carefully, test with examples, then submit. Every wrong attempt costs 5 minutes of penalty.
            </li>
            <li className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-0">
              <span className="shrink-0 font-medium text-brand sm:mr-2">After the contest:</span>
              All contest problems become available on the normal Problems page so you can practice anytime.
            </li>
          </ul>
        </motion.div>

        <motion.div
          className="grid gap-8 lg:grid-cols-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
        >
          <section>
            <h2 className="mb-3 text-lg font-semibold text-primary">Problems</h2>
            {contest.problems.length === 0 ? (
              <p className="text-sm text-secondary">No problems in this contest.</p>
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
                        className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                          hasDetails ? 'text-primary hover:bg-secondary' : 'cursor-default pointer-events-none text-tertiary'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 font-medium">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary">
                            {order}
                          </span>
                          {isUpcoming ? `Question ${order}` : (p.title ?? 'Problem')}
                        </span>
                        {hasDetails && p.difficulty != null && (
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-xs capitalize ${
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
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-primary">
              <Trophy className="h-5 w-5 text-brand" />
              Leaderboard
            </h2>
            {leaderboard.length === 0 ? (
              <div className="rounded-xl border border-border-primary bg-elevated p-4">
                <p className="text-sm text-secondary">No submissions yet.</p>
              </div>
            ) : (
              <>
                {podium.length > 0 && <PodiumRow podium={podium} />}
                {rest.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {rest.map((entry) => (
                      <Link
                        key={entry.userId}
                        href={`/user/${entry.username}`}
                        className="group flex items-center gap-3 rounded-xl border border-border-primary bg-elevated px-3 py-2.5 transition-all hover:border-brand/40"
                      >
                        <span className="w-6 shrink-0 text-right text-xs font-bold text-tertiary">#{entry.rank}</span>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-secondary">
                          {getInitials(entry)}
                        </div>
                        <span className="flex-1 truncate text-sm font-medium text-primary group-hover:underline">
                          {entry.username}
                        </span>
                        <div className="flex shrink-0 items-center gap-3 text-xs text-tertiary">
                          <span>
                            <span className="font-semibold text-secondary">{entry.score}</span> pts
                          </span>
                          <span>{entry.penalty}m penalty</span>
                          <span>{entry.totalTimeMinutes.toFixed(0)}m</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
