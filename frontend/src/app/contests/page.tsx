'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Trophy,
  Clock,
  History,
  Users,
  Target,
  CalendarDays,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Crown,
  Medal,
  Award,
  Radio,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import type { RootState } from '@/app/store/store';
import { contestAPI, type ContestListItem, type LeaderboardEntry } from '@/app/utils/contestAPI';
import Footer from '@/app/components/Footer';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(s: string) {
  const d = new Date(s);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function formatCountdown(startTime: string): string {
  const diff = new Date(startTime).getTime() - Date.now();
  if (diff <= 0) return 'Starting soon';
  const totalMins = Math.floor(diff / 60000);
  const days = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins = totalMins % 60;
  if (days > 0) return `Starts in ${days}d ${hours}h`;
  if (hours > 0) return `Starts in ${hours}h ${mins}m`;
  return `Starts in ${mins}m`;
}

function getInitials(entry: LeaderboardEntry): string {
  return entry.username.slice(0, 2).toUpperCase();
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider"
      style={{ background: 'var(--success-bg, rgba(34,197,94,0.15))', color: 'var(--success, #22c55e)' }}>
      <span
        className="h-1.5 w-1.5 rounded-full animate-pulse"
        style={{ background: 'var(--success, #22c55e)' }}
      />
      LIVE
    </span>
  );
}

function RunningContestCard({ c }: { c: ContestListItem }) {
  return (
    <div
      className="relative rounded-2xl p-5 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid rgba(34,197,94,0.35)',
        boxShadow: '0 0 0 1px rgba(34,197,94,0.12), 0 4px 24px rgba(34,197,94,0.06)',
      }}
    >
      {/* subtle green glow strip at top */}
      <div
        className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl"
        style={{ background: 'linear-gradient(90deg, transparent, var(--success, #22c55e), transparent)' }}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <LiveBadge />
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Ends {formatDate(c.endTime)}
            </span>
          </div>
          <Link
            href={`/contests/${c._id}`}
            className="text-lg font-bold hover:underline truncate block"
            style={{ color: 'var(--text-primary)' }}
          >
            {c.title}
          </Link>
          <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {c.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {c.participantCount} participants
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(c.duration)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {c.registered && (
            <span
              className="rounded-full px-2 py-1 text-[11px] font-medium"
              style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--success, #22c55e)' }}
            >
              Registered
            </span>
          )}
          <Link
            href={`/contests/${c._id}`}
            className="rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--success, #22c55e)', color: '#fff' }}
          >
            Enter Now
          </Link>
        </div>
      </div>
    </div>
  );
}

function UpcomingContestCard({ c }: { c: ContestListItem }) {
  return (
    <div
      className="rounded-2xl p-4 hover:shadow-md transition-all duration-200 hover:border-brand/50"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              Upcoming
            </span>
          </div>
          <Link
            href={`/contests/${c._id}`}
            className="text-base font-semibold hover:underline truncate block"
            style={{ color: 'var(--text-primary)' }}
          >
            {c.title}
          </Link>
          <p className="text-sm mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {c.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span className="flex items-center gap-1 font-medium" style={{ color: 'var(--primary)' }}>
              <CalendarDays className="h-3.5 w-3.5" />
              {formatCountdown(c.startTime)}
            </span>
            <span>{formatDate(c.startTime)}</span>
            <span>{formatDuration(c.duration)}</span>
            <span>{c.participantCount} registered</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {c.registered && (
            <span
              className="rounded-full px-2 py-1 text-[11px] font-medium"
              style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--success, #22c55e)' }}
            >
              Registered
            </span>
          )}
          <Link
            href={`/contests/${c._id}`}
            className="rounded-xl px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            {c.registered ? 'View' : 'Register'}
          </Link>
        </div>
      </div>
    </div>
  );
}

function PastContestRow({ c }: { c: ContestListItem }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl hover:border-brand/40 transition-all"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
    >
      <div className="flex-1 min-w-0">
        <Link
          href={`/contests/${c._id}`}
          className="text-sm font-semibold hover:underline truncate block"
          style={{ color: 'var(--text-primary)' }}
        >
          {c.title}
        </Link>
        <div className="flex flex-wrap gap-3 mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>{formatDate(c.startTime)}</span>
          <span>{formatDuration(c.duration)}</span>
          <span>{c.participantCount} participants</span>
        </div>
      </div>
      <Link
        href={`/contests/${c._id}`}
        className="text-xs font-medium rounded-lg px-3 py-1.5 transition-opacity hover:opacity-80 shrink-0"
        style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
      >
        View Results
      </Link>
    </div>
  );
}

// ─── Podium Card ────────────────────────────────────────────────────────────

function PodiumCard({
  entry,
  position,
}: {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
}) {
  const isFirst = position === 1;

  const podiumColors: Record<number, { bg: string; border: string; label: string; labelColor: string }> = {
    1: { bg: 'rgba(250,204,21,0.08)', border: 'rgba(250,204,21,0.4)', label: 'bg-yellow-400/20', labelColor: '#f59e0b' },
    2: { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.35)', label: 'bg-slate-400/20', labelColor: '#94a3b8' },
    3: { bg: 'rgba(180,120,60,0.08)', border: 'rgba(180,120,60,0.35)', label: 'bg-orange-400/20', labelColor: '#cd7c3a' },
  };

  const colors = podiumColors[position];

  return (
    <Link
      href={`/${entry.username}`}
      className={`flex flex-col items-center rounded-2xl p-4 text-center hover:shadow-lg transition-all duration-200 hover:scale-105 ${isFirst ? 'py-6' : 'py-4'}`}
      style={{
        background: isFirst
          ? `linear-gradient(160deg, ${colors.bg}, var(--bg-elevated))`
          : `var(--bg-elevated)`,
        border: `1px solid ${colors.border}`,
        minWidth: isFirst ? 160 : 130,
      }}
    >
      {isFirst && (
        <Crown className="mb-2 h-6 w-6" style={{ color: '#f59e0b' }} />
      )}
      {position === 2 && <Medal className="mb-2 h-5 w-5" style={{ color: '#94a3b8' }} />}
      {position === 3 && <Award className="mb-2 h-5 w-5" style={{ color: '#cd7c3a' }} />}

      {/* Avatar */}
      <div
        className={`flex items-center justify-center rounded-full font-bold ${isFirst ? 'h-14 w-14 text-base mb-2' : 'h-11 w-11 text-sm mb-1.5'}`}
        style={{
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          color: colors.labelColor,
        }}
      >
        {getInitials(entry)}
      </div>

      <span
        className={`font-semibold truncate max-w-[120px] ${isFirst ? 'text-base' : 'text-sm'}`}
        style={{ color: 'var(--text-primary)' }}
      >
        {entry.username}
      </span>

      <span
        className="mt-0.5 text-xs font-medium"
        style={{ color: colors.labelColor }}
      >
        #{position}
      </span>

      <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{entry.score}</span>
        {' pts'}
      </div>
      <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
        {entry.solvedProblems.length} solved
      </div>
    </Link>
  );
}

// ─── Section Wrappers ────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span style={{ color: 'var(--primary)' }}>{icon}</span>
      <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      {count !== undefined && (
        <span
          className="ml-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyState({ icon, title, message, action }: {
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl px-6 py-10 text-center"
      style={{ border: '1.5px dashed var(--border-primary)', background: 'var(--bg-elevated)' }}
    >
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}
      >
        {icon}
      </div>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
      <p className="mt-1 text-xs max-w-sm" style={{ color: 'var(--text-secondary)' }}>{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm mb-4"
      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444' }}
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function Sk({ className }: { className?: string }) {
  return <div className={`skeleton rounded ${className ?? ''}`} />;
}

function RunningContestSkeleton() {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Sk className="h-5 w-16" />
            <Sk className="h-5 w-32" />
          </div>
          <Sk className="h-6 w-3/4" />
          <Sk className="h-4 w-full" />
          <Sk className="h-4 w-2/3" />
          <div className="flex gap-4 mt-3">
            <Sk className="h-4 w-24" />
            <Sk className="h-4 w-20" />
          </div>
        </div>
        <Sk className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
}

function UpcomingContestSkeleton() {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Sk className="h-4 w-20" />
          <Sk className="h-5 w-3/4" />
          <Sk className="h-4 w-full" />
          <div className="flex gap-3 mt-2">
            <Sk className="h-3 w-28" />
            <Sk className="h-3 w-24" />
            <Sk className="h-3 w-16" />
          </div>
        </div>
        <Sk className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
}

function MyContestSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}>
      <div className="flex-1 space-y-1.5">
        <Sk className="h-4 w-2/3" />
        <div className="flex gap-3">
          <Sk className="h-3 w-24" />
          <Sk className="h-3 w-16" />
        </div>
      </div>
      <Sk className="h-7 w-16 rounded-lg" />
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <>
      <div className="flex items-end justify-center gap-3 mb-4">
        {([130, 160, 130] as const).map((minW, i) => (
          <div key={i} className="flex flex-col items-center" style={{ minWidth: minW }}>
            <Sk className={`w-full rounded-2xl ${i === 1 ? 'h-44' : 'h-36'}`} />
            <Sk className={`w-full rounded-b-lg ${i === 1 ? 'h-12' : i === 0 ? 'h-8' : 'h-5'}`} />
          </div>
        ))}
      </div>
      <div className="space-y-1.5 mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}>
            <Sk className="h-4 w-6" />
            <Sk className="h-7 w-7 rounded-full" />
            <Sk className="h-4 w-28" />
            <div className="flex gap-3 ml-auto">
              <Sk className="h-3 w-16" />
              <Sk className="h-3 w-14" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PastContestSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}>
      <div className="flex-1 space-y-1.5">
        <Sk className="h-4 w-1/2" />
        <div className="flex gap-3">
          <Sk className="h-3 w-24" />
          <Sk className="h-3 w-16" />
          <Sk className="h-3 w-20" />
        </div>
      </div>
      <Sk className="h-7 w-24 rounded-lg" />
    </div>
  );
}

function ContestsPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <div style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center gap-4">
            <Sk className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Sk className="h-8 w-48" />
              <Sk className="h-4 w-80" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-10">
        <section>
          <Sk className="h-6 w-28 mb-4" />
          <div className="grid gap-4 md:grid-cols-2">
            <RunningContestSkeleton /><RunningContestSkeleton />
          </div>
        </section>
        <section>
          <Sk className="h-6 w-28 mb-4" />
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <UpcomingContestSkeleton key={i} />)}
          </div>
        </section>
        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <Sk className="h-6 w-28 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <MyContestSkeleton key={i} />)}
            </div>
          </section>
          <section>
            <Sk className="h-6 w-28 mb-4" />
            <LeaderboardSkeleton />
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ContestsPage() {
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);

  // Active contests (running + upcoming loaded together)
  const [runningContests, setRunningContests] = useState<ContestListItem[]>([]);
  const [upcomingContests, setUpcomingContests] = useState<ContestListItem[]>([]);
  const [activeLoading, setActiveLoading] = useState(true);
  const [activeError, setActiveError] = useState<string | null>(null);

  // Past contests — collapsible, lazy-loaded
  const [pastContests, setPastContests] = useState<ContestListItem[]>([]);
  const [pastExpanded, setPastExpanded] = useState(false);
  const [pastLoading, setPastLoading] = useState(false);
  const [pastLoaded, setPastLoaded] = useState(false);
  const [pastError, setPastError] = useState<string | null>(null);
  const [pastTotal, setPastTotal] = useState(0);

  // My contests
  const [myContests, setMyContests] = useState<ContestListItem[]>([]);
  const [myLoading, setMyLoading] = useState(true);
  const [myError, setMyError] = useState<string | null>(null);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardContestTitle, setLeaderboardContestTitle] = useState<string>('');
  const [lbLoading, setLbLoading] = useState(true);
  const [lbError, setLbError] = useState<string | null>(null);

  // ── Load active contests ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) {
      setActiveLoading(false);
      setMyLoading(false);
      setLbLoading(false);
      return;
    }

    // Running + upcoming in parallel
    Promise.all([
      contestAPI.list({ status: 'running', page: 1, limit: 20 }),
      contestAPI.list({ status: 'upcoming', page: 1, limit: 20 }),
    ])
      .then(([r, u]) => {
        setRunningContests(r.contests || []);
        setUpcomingContests(u.contests || []);
      })
      .catch((err) => setActiveError(err.response?.data?.error || 'Failed to load contests'))
      .finally(() => setActiveLoading(false));
  }, [isInitialized, isAuthenticated]);

  // ── Load my contests ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    contestAPI
      .my()
      .then((res) => setMyContests(res.contests || []))
      .catch((err) => setMyError(err.response?.data?.error || 'Failed to load your contests'))
      .finally(() => setMyLoading(false));
  }, [isInitialized, isAuthenticated]);

  // ── Load leaderboard from most recent ended contest ───────────────────────
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    contestAPI
      .list({ status: 'ended', page: 1, limit: 1 })
      .then(async (res) => {
        const latest = res.contests?.[0];
        if (!latest) {
          setLeaderboard([]);
          setLbLoading(false);
          return;
        }
        setLeaderboardContestTitle(latest.title);
        const lb = await contestAPI.leaderboard(latest._id, { page: 1, limit: 10 });
        setLeaderboard(lb.leaderboard || []);
      })
      .catch((err) => setLbError(err.response?.data?.error || 'Failed to load leaderboard'))
      .finally(() => setLbLoading(false));
  }, [isInitialized, isAuthenticated]);

  // ── Lazy load past contests ───────────────────────────────────────────────
  const loadPastContests = useCallback(() => {
    if (pastLoaded || pastLoading) return;
    setPastLoading(true);
    contestAPI
      .list({ status: 'ended', page: 1, limit: 20 })
      .then((res) => {
        setPastContests(res.contests || []);
        setPastTotal(res.total || 0);
        setPastLoaded(true);
      })
      .catch((err) => setPastError(err.response?.data?.error || 'Failed to load past contests'))
      .finally(() => setPastLoading(false));
  }, [pastLoaded, pastLoading]);

  const handlePastToggle = () => {
    if (!pastExpanded && !pastLoaded) loadPastContests();
    setPastExpanded((v) => !v);
  };

  // ── Auth guards ───────────────────────────────────────────────────────────
  if (!isInitialized) {
    return <ContestsPageSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(var(--primary),0.1)', color: 'var(--primary)' }}
          >
            <Trophy className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Contests
          </h1>
          <p className="text-base mb-8 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Log in to register for live contests, compete on the leaderboard, and unlock
            exclusive problems after each round.
          </p>
          <Link
            href="/accounts/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Log in to join contests
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const podium = leaderboard.slice(0, 3) as LeaderboardEntry[];
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* ── Page Hero ─────────────────────────────────────────────────────── */}
      <div className="bg-[var(--card)] border-b border-[var(--border)]">
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 py-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10">
                <Trophy className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[var(--foreground)]">Contests</h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                  Compete in timed rounds, climb the leaderboard, and unlock problems after each contest.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] bg-[var(--muted)]/60 px-3 py-1.5 rounded-full border border-[var(--border)]">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Join live rounds · Grow your TrueCode rating</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-10">

        {activeError && <ErrorBanner message={activeError} />}

        {/* ── Running Contests ──────────────────────────────────────────────── */}
        {(activeLoading || runningContests.length > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <SectionHeader
              icon={<Radio className="h-5 w-5" />}
              title="Live Now"
              count={activeLoading ? undefined : runningContests.length}
            />
            {activeLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <RunningContestSkeleton /><RunningContestSkeleton />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {runningContests.map((c) => (
                  <RunningContestCard key={c._id} c={c} />
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* ── Upcoming Contests ─────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
        >
          <SectionHeader
            icon={<CalendarDays className="h-5 w-5" />}
            title="Upcoming"
            count={activeLoading ? undefined : upcomingContests.length}
          />
          {activeLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <UpcomingContestSkeleton key={i} />)}
            </div>
          ) : upcomingContests.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" />}
              title="No upcoming contests"
              message="New contests are announced regularly. Practice problems to get ready for the next one."
              action={
                <Link
                  href="/problems"
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold hover:opacity-90"
                  style={{ background: 'var(--primary)', color: '#fff' }}
                >
                  <Target className="h-4 w-4" />
                  Practice problems
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {upcomingContests.map((c) => (
                <UpcomingContestCard key={c._id} c={c} />
              ))}
            </div>
          )}
        </motion.section>

        {/* ── Two-column: My Contests + Leaderboard ────────────────────────── */}
        <motion.div
          className="grid gap-8 lg:grid-cols-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
        >

          {/* My Contests */}
          <section>
            <SectionHeader
              icon={<BookOpen className="h-5 w-5" />}
              title="My Contests"
              count={myLoading ? undefined : myContests.length}
            />
            {myError && <ErrorBanner message={myError} />}
            {myLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <MyContestSkeleton key={i} />)}
              </div>
            ) : myContests.length === 0 ? (
              <EmptyState
                icon={<Users className="h-6 w-6" />}
                title="You haven't participated yet"
                message="Register for an upcoming contest or join a live one above to see your history here."
              />
            ) : (
              <div className="space-y-2">
                {myContests.map((c) => (
                  <div
                    key={c._id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 hover:border-brand/40 transition-all"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/contests/${c._id}`}
                        className="text-sm font-semibold hover:underline truncate block"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {c.title}
                      </Link>
                      <div className="flex flex-wrap gap-3 mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <span>{formatDate(c.startTime)}</span>
                        <span
                          className="capitalize font-medium"
                          style={{
                            color:
                              c.status === 'running'
                                ? 'var(--success, #22c55e)'
                                : c.status === 'upcoming'
                                  ? 'var(--primary)'
                                  : 'var(--text-tertiary)',
                          }}
                        >
                          {c.status === 'running' ? '● Live' : c.status}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/contests/${c._id}`}
                      className="text-xs font-medium rounded-lg px-3 py-1.5 shrink-0 hover:opacity-80 transition-opacity"
                      style={{
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-primary)',
                      }}
                    >
                      {c.status === 'running' ? 'Enter' : c.status === 'upcoming' ? 'View' : 'Results'}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Leaderboard */}
          <section>
            <SectionHeader
              icon={<Trophy className="h-5 w-5" />}
              title="Top Performers"
            />
            {leaderboardContestTitle && (
              <p className="text-xs mb-3 -mt-2 truncate" style={{ color: 'var(--text-tertiary)' }}>
                From: <span style={{ color: 'var(--text-secondary)' }}>{leaderboardContestTitle}</span>
              </p>
            )}
            {lbError && <ErrorBanner message={lbError} />}
            {lbLoading ? (
              <LeaderboardSkeleton />
            ) : leaderboard.length === 0 ? (
              <EmptyState
                icon={<Trophy className="h-6 w-6" />}
                title="No leaderboard data yet"
                message="Once a contest ends, the top performers will appear here. Be the first to claim the crown!"
              />
            ) : (
              <>
                {/* Podium — 2nd | 1st | 3rd */}
                {podium.length >= 1 && (
                  <div className="flex items-end justify-center gap-3 mb-4">
                    {podium[1] && (
                      <div className="flex flex-col items-center">
                        <PodiumCard entry={podium[1]} position={2} />
                        <div
                          className="w-full h-8 rounded-b-lg mt-0"
                          style={{ background: 'rgba(148,163,184,0.15)', minWidth: 110 }}
                        />
                      </div>
                    )}
                    {podium[0] && (
                      <div className="flex flex-col items-center">
                        <PodiumCard entry={podium[0]} position={1} />
                        <div
                          className="w-full h-12 rounded-b-lg"
                          style={{ background: 'rgba(250,204,21,0.12)', minWidth: 130 }}
                        />
                      </div>
                    )}
                    {podium[2] && (
                      <div className="flex flex-col items-center">
                        <PodiumCard entry={podium[2]} position={3} />
                        <div
                          className="w-full h-5 rounded-b-lg"
                          style={{ background: 'rgba(180,120,60,0.12)', minWidth: 110 }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Ranks 4–10 */}
                {rest.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {rest.map((entry) => (
                      <Link
                        key={entry.username}
                        href={`/${entry.username}`}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:border-brand/40 transition-all group"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
                      >
                        <span
                          className="w-6 text-xs font-bold text-right shrink-0"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          #{entry.rank}
                        </span>
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold shrink-0"
                          style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                        >
                          {getInitials(entry)}
                        </div>
                        <span
                          className="flex-1 text-sm font-medium truncate group-hover:underline"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {entry.username}
                        </span>
                        <div className="flex items-center gap-3 text-xs shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                          <span>
                            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                              {entry.score}
                            </span>{' '}pts
                          </span>
                          <span>{entry.solvedProblems.length} solved</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </motion.div>

        {/* ── Past Contests (collapsible) ───────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
        >
          <button
            type="button"
            onClick={handlePastToggle}
            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all hover:border-brand/40"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-primary)',
            }}
          >
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Past Contests
              </span>
              {pastLoaded && pastTotal > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                >
                  {pastTotal}
                </span>
              )}
            </div>
            {pastExpanded
              ? <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
              : <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />}
          </button>

          {pastExpanded && (
            <div className="mt-3">
              {pastError && <ErrorBanner message={pastError} />}
              {pastLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <PastContestSkeleton key={i} />)}
                </div>
              ) : pastContests.length === 0 ? (
                <EmptyState
                  icon={<History className="h-6 w-6" />}
                  title="No past contests yet"
                  message="Once contests finish, their problems gradually unlock on the Problems page for practice."
                  action={
                    <Link
                      href="/problems"
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold hover:opacity-90"
                      style={{ background: 'var(--primary)', color: '#fff' }}
                    >
                      <Target className="h-4 w-4" />
                      Practice problems
                    </Link>
                  }
                />
              ) : (
                <>
                  <div className="space-y-2">
                    {pastContests.map((c) => (
                      <PastContestRow key={c._id} c={c} />
                    ))}
                  </div>
                  {pastTotal > pastContests.length && (
                    <p className="mt-3 text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
                      Showing {pastContests.length} of {pastTotal} contests
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </motion.section>
      </div>

      <Footer />
    </div>
  );
}
