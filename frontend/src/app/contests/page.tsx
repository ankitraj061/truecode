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
  Radio,
  BookOpen,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import type { RootState } from '@/app/store/store';
import { contestAPI, type ContestListItem, type LeaderboardEntry } from '@/app/utils/contestAPI';
import Footer from '@/app/components/Footer';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { useNow, formatCountdown, getInitials, PodiumRow } from './_shared';

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

// ─── Motion variants ──────────────────────────────────────────────────────────

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-success">
      <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
      LIVE
    </span>
  );
}

function HeroStat({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border-primary bg-elevated/60 backdrop-blur-sm px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
        {icon}
      </div>
      <div>
        <div className="text-lg font-bold leading-none text-primary">{value}</div>
        <div className="mt-0.5 text-xs text-tertiary">{label}</div>
      </div>
    </div>
  );
}

function SpotlightCard({ contest, mode, now }: { contest: ContestListItem; mode: 'running' | 'upcoming'; now: Date }) {
  const isRunning = mode === 'running';
  const countdown = formatCountdown(isRunning ? contest.endTime : contest.startTime, now, isRunning ? 'end' : 'start');

  return (
    <div className="relative max-w-2xl overflow-hidden rounded-2xl border border-border-primary bg-elevated p-6">
      {isRunning && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-success to-transparent" />
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            {isRunning ? (
              <LiveBadge />
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-primary">
                <CalendarDays className="h-3 w-3" /> UPCOMING
              </span>
            )}
            <span className="text-xs text-tertiary">{contest.participantCount} registered</span>
          </div>
          <Link href={`/contests/${contest._id}`} className="block truncate text-xl font-bold text-primary hover:underline">
            {contest.title}
          </Link>
          <p className="mt-1 line-clamp-2 text-sm text-secondary">{contest.description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className={`text-2xl font-bold tabular-nums ${isRunning ? 'text-success' : 'text-brand'}`}>
            {countdown}
          </div>
          <div className="text-[11px] text-tertiary">{isRunning ? 'remaining' : 'until start'}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1 text-xs text-tertiary">
          <Clock className="h-3.5 w-3.5" /> {formatDuration(contest.duration)}
        </span>
        <Link
          href={`/contests/${contest._id}`}
          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-inverse transition-opacity hover:opacity-90 ${
            isRunning ? 'bg-success' : 'bg-brand'
          }`}
        >
          {isRunning ? 'Enter Now' : contest.registered ? 'View' : 'Register'}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function RunningContestCard({ c, now }: { c: ContestListItem; now: Date }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-success/35 bg-elevated p-5 shadow-md transition-all duration-200 hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-transparent via-success to-transparent" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <LiveBadge />
            <span className="text-xs text-tertiary">Ends in {formatCountdown(c.endTime, now, 'end')}</span>
          </div>
          <Link href={`/contests/${c._id}`} className="block truncate text-lg font-bold text-primary hover:underline">
            {c.title}
          </Link>
          <p className="mt-1 line-clamp-2 text-sm text-secondary">{c.description}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-tertiary">
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
        <div className="flex shrink-0 flex-col items-end gap-2">
          {c.registered && (
            <span className="rounded-full bg-success/15 px-2 py-1 text-[11px] font-medium text-success">Registered</span>
          )}
          <Link
            href={`/contests/${c._id}`}
            className="rounded-xl bg-success px-4 py-2 text-sm font-semibold text-inverse transition-opacity hover:opacity-90"
          >
            Enter Now
          </Link>
        </div>
      </div>
    </div>
  );
}

function UpcomingContestCard({ c, now }: { c: ContestListItem; now: Date }) {
  return (
    <div className="rounded-2xl border border-border-primary bg-elevated p-4 transition-all duration-200 hover:border-brand/50 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-primary">Upcoming</span>
          </div>
          <Link href={`/contests/${c._id}`} className="block truncate text-base font-semibold text-primary hover:underline">
            {c.title}
          </Link>
          <p className="mt-0.5 line-clamp-2 text-sm text-secondary">{c.description}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-tertiary">
            <span className="flex items-center gap-1 font-medium text-brand">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatCountdown(c.startTime, now, 'start')}
            </span>
            <span>{formatDate(c.startTime)}</span>
            <span>{formatDuration(c.duration)}</span>
            <span>{c.participantCount} registered</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {c.registered && (
            <span className="rounded-full bg-success/15 px-2 py-1 text-[11px] font-medium text-success">Registered</span>
          )}
          <Link
            href={`/contests/${c._id}`}
            className="rounded-xl bg-brand px-3 py-1.5 text-sm font-medium text-inverse transition-opacity hover:opacity-80"
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-primary bg-elevated px-4 py-3 transition-all hover:border-brand/40">
      <div className="min-w-0 flex-1">
        <Link href={`/contests/${c._id}`} className="block truncate text-sm font-semibold text-primary hover:underline">
          {c.title}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-tertiary">
          <span className="rounded-full bg-tertiary px-2 py-0.5 text-[11px] font-medium capitalize text-secondary">Ended</span>
          <span>{formatDate(c.startTime)}</span>
          <span>{formatDuration(c.duration)}</span>
          <span>{c.participantCount} participants</span>
        </div>
      </div>
      <Link
        href={`/contests/${c._id}`}
        className="shrink-0 rounded-lg border border-border-primary bg-secondary px-3 py-1.5 text-xs font-medium text-secondary transition-opacity hover:opacity-80"
      >
        View Results
      </Link>
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

type TabKey = 'leaderboard' | 'mine' | 'past';

function TabBar({
  active,
  onChange,
  tabs,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
  tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-border-primary pb-3">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand text-inverse'
                : 'border border-border-primary bg-elevated text-secondary hover:border-brand/40'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? 'bg-white/20' : 'bg-secondary text-secondary'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Section Wrappers ────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-brand">{icon}</span>
      <h2 className="text-lg font-bold text-primary">{title}</h2>
      {count !== undefined && (
        <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary">{count}</span>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-[1.5px] border-dashed border-border-primary bg-elevated px-6 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-tertiary">{icon}</div>
      <p className="text-sm font-semibold text-primary">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-secondary">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-error/35 bg-error/10 px-4 py-3 text-sm text-error">
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
    <div className="rounded-2xl border border-border-primary bg-elevated p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Sk className="h-5 w-16" />
            <Sk className="h-5 w-32" />
          </div>
          <Sk className="h-6 w-3/4" />
          <Sk className="h-4 w-full" />
          <Sk className="h-4 w-2/3" />
          <div className="mt-3 flex gap-4">
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
    <div className="rounded-2xl border border-border-primary bg-elevated p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Sk className="h-4 w-20" />
          <Sk className="h-5 w-3/4" />
          <Sk className="h-4 w-full" />
          <div className="mt-2 flex gap-3">
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-primary bg-elevated px-4 py-3">
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
      <div className="mb-4 flex items-end justify-center gap-3">
        {([130, 160, 130] as const).map((minW, i) => (
          <div key={i} className="flex flex-col items-center" style={{ minWidth: minW }}>
            <Sk className={`w-full rounded-2xl ${i === 1 ? 'h-44' : 'h-36'}`} />
            <Sk className={`w-full rounded-b-lg ${i === 1 ? 'h-12' : i === 0 ? 'h-8' : 'h-5'}`} />
          </div>
        ))}
      </div>
      <div className="mt-2 space-y-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border-primary bg-elevated px-3 py-2.5">
            <Sk className="h-4 w-6" />
            <Sk className="h-7 w-7 rounded-full" />
            <Sk className="h-4 w-28" />
            <div className="ml-auto flex gap-3">
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-primary bg-elevated px-4 py-3">
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

function SpotlightSkeleton() {
  return (
    <div className="max-w-2xl rounded-2xl border border-border-primary bg-elevated p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Sk className="h-5 w-24" />
          <Sk className="h-6 w-2/3" />
          <Sk className="h-4 w-full" />
        </div>
        <Sk className="h-8 w-24" />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Sk className="h-4 w-16" />
        <Sk className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

function ContestsPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-primary">
      <div className="border-b border-border-primary bg-elevated">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="flex items-center gap-3">
            <Sk className="h-11 w-11 rounded-xl" />
            <div className="space-y-2">
              <Sk className="h-8 w-48" />
              <Sk className="h-4 w-80" />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Sk className="h-14 w-40 rounded-2xl" />
            <Sk className="h-14 w-40 rounded-2xl" />
          </div>
          <div className="mt-6">
            <SpotlightSkeleton />
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl flex-1 space-y-10 px-4 py-8 sm:px-6">
        <section>
          <Sk className="mb-4 h-6 w-28" />
          <div className="grid gap-4 md:grid-cols-2">
            <RunningContestSkeleton />
            <RunningContestSkeleton />
          </div>
        </section>
        <section>
          <Sk className="mb-4 h-6 w-28" />
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <UpcomingContestSkeleton key={i} />
            ))}
          </div>
        </section>
        <section>
          <div className="mb-4 flex gap-2">
            <Sk className="h-9 w-28 rounded-full" />
            <Sk className="h-9 w-28 rounded-full" />
            <Sk className="h-9 w-28 rounded-full" />
          </div>
          <LeaderboardSkeleton />
        </section>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ContestsPage() {
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  const now = useNow();

  // Active contests (running + upcoming loaded together)
  const [runningContests, setRunningContests] = useState<ContestListItem[]>([]);
  const [upcomingContests, setUpcomingContests] = useState<ContestListItem[]>([]);
  const [activeLoading, setActiveLoading] = useState(true);
  const [activeError, setActiveError] = useState<string | null>(null);

  // Past contests — lazy-loaded on first tab visit
  const [pastContests, setPastContests] = useState<ContestListItem[]>([]);
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

  // Secondary-content tabs
  const [activeTab, setActiveTab] = useState<TabKey>('leaderboard');

  // ── Load active contests ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) return;

    Promise.all([
      contestAPI.list({ status: 'running', page: 1, limit: 20 }),
      contestAPI.list({ status: 'upcoming', page: 1, limit: 20 }),
    ])
      .then(([r, u]) => {
        // Backend sorts by startTime desc; re-sort ascending so index 0 is the
        // soonest-relevant contest (used for both the grid order and the spotlight).
        setRunningContests(
          (r.contests || []).slice().sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime())
        );
        setUpcomingContests(
          (u.contests || []).slice().sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        );
      })
      .catch((err) => setActiveError(err.response?.data?.error || 'Failed to load contests'))
      .finally(() => setActiveLoading(false));
  }, [isInitialized]);

  // ── Load my contests ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      setMyLoading(false);
      return;
    }

    contestAPI
      .my()
      .then((res) => setMyContests(res.contests || []))
      .catch((err) => setMyError(err.response?.data?.error || 'Failed to load your contests'))
      .finally(() => setMyLoading(false));
  }, [isInitialized, isAuthenticated]);

  // ── Load leaderboard from most recent ended contest ───────────────────────
  useEffect(() => {
    if (!isInitialized) return;

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
  }, [isInitialized]);

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

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === 'past') loadPastContests();
  };

  // ── Auth guards ───────────────────────────────────────────────────────────
  if (!isInitialized) {
    return <ContestsPageSkeleton />;
  }

  const podium = leaderboard.slice(0, 3) as LeaderboardEntry[];
  const rest = leaderboard.slice(3);

  const spotlight = runningContests[0] ?? upcomingContests[0] ?? null;
  const spotlightMode: 'running' | 'upcoming' = runningContests[0] ? 'running' : 'upcoming';

  return (
    <div className="flex min-h-screen flex-col bg-primary">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border-primary bg-elevated">
        <div className="absolute inset-0 z-0">
          <FlickeringGrid
            className="absolute inset-0 [mask-image:radial-gradient(480px_circle_at_center,white,transparent)]"
            squareSize={4}
            gridGap={6}
            color="#4ade80"
            maxOpacity={0.25}
            flickerChance={0.1}
          />
        </div>
        <div className="absolute inset-0 z-[1] animate-gradient-shift bg-gradient-to-br from-brand/6 via-transparent to-emerald-500/6" />

        <motion.div
          className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10">
              <Trophy className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary lg:text-4xl">Contests</h1>
              <p className="mt-0.5 text-sm text-secondary">
                Compete in timed rounds, climb the leaderboard, and unlock problems after each contest.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <HeroStat
              icon={<Radio className="h-4 w-4" />}
              value={activeLoading ? '—' : runningContests.length}
              label="Live Now"
            />
            <HeroStat
              icon={<CalendarDays className="h-4 w-4" />}
              value={activeLoading ? '—' : upcomingContests.length}
              label="Upcoming"
            />
            {isAuthenticated && (
              <HeroStat
                icon={<BookOpen className="h-4 w-4" />}
                value={myLoading ? '—' : myContests.length}
                label="My Registrations"
              />
            )}
          </div>

          <div className="mt-6">
            {activeLoading ? (
              <SpotlightSkeleton />
            ) : (
              spotlight && <SpotlightCard contest={spotlight} mode={spotlightMode} now={now} />
            )}
          </div>
        </motion.div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 space-y-10 px-4 py-8 sm:px-6">
        {activeError && <ErrorBanner message={activeError} />}

        {/* ── Live Now ───────────────────────────────────────────────────── */}
        {(activeLoading || runningContests.length > 0) && (
          <section>
            <SectionHeader
              icon={<Radio className="h-5 w-5" />}
              title="Live Now"
              count={activeLoading ? undefined : runningContests.length}
            />
            {activeLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <RunningContestSkeleton />
                <RunningContestSkeleton />
              </div>
            ) : (
              <motion.div
                className="grid gap-4 md:grid-cols-2"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
              >
                {runningContests.map((c) => (
                  <motion.div key={c._id} variants={fadeUpItem}>
                    <RunningContestCard c={c} now={now} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>
        )}

        {/* ── Upcoming ───────────────────────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={<CalendarDays className="h-5 w-5" />}
            title="Upcoming"
            count={activeLoading ? undefined : upcomingContests.length}
          />
          {activeLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <UpcomingContestSkeleton key={i} />
              ))}
            </div>
          ) : upcomingContests.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" />}
              title="No upcoming contests"
              message="New contests are announced regularly. Practice problems to get ready for the next one."
              action={
                <Link
                  href="/problems"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-inverse hover:opacity-90"
                >
                  <Target className="h-4 w-4" />
                  Practice problems
                </Link>
              }
            />
          ) : (
            <motion.div
              className="grid gap-3 md:grid-cols-2"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
            >
              {upcomingContests.map((c) => (
                <motion.div key={c._id} variants={fadeUpItem}>
                  <UpcomingContestCard c={c} now={now} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* ── Secondary content tabs ─────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4 }}
        >
          <TabBar
            active={activeTab}
            onChange={handleTabChange}
            tabs={[
              { key: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="h-4 w-4" /> },
              {
                key: 'mine',
                label: 'My Contests',
                icon: <BookOpen className="h-4 w-4" />,
                badge: isAuthenticated ? myContests.length : undefined,
              },
              { key: 'past', label: 'Past Contests', icon: <History className="h-4 w-4" />, badge: pastLoaded ? pastTotal : undefined },
            ]}
          />

          <div className="mt-6">
            {/* Leaderboard panel */}
            {activeTab === 'leaderboard' && (
              <div>
                <SectionHeader icon={<Trophy className="h-5 w-5" />} title="Top Performers" />
                {leaderboardContestTitle && (
                  <p className="-mt-2 mb-3 truncate text-xs text-tertiary">
                    From: <span className="text-secondary">{leaderboardContestTitle}</span>
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
                    {podium.length >= 1 && <PodiumRow podium={podium} />}

                    {rest.length > 0 && (
                      <div className="mx-auto mt-2 max-w-2xl space-y-1.5">
                        {rest.map((entry) => (
                          <Link
                            key={entry.username}
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
                              <span>{entry.solvedProblems.length} solved</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* My Contests panel */}
            {activeTab === 'mine' && (
              <div>
                <SectionHeader icon={<BookOpen className="h-5 w-5" />} title="My Contests" count={myLoading ? undefined : myContests.length} />
                {myError && <ErrorBanner message={myError} />}
                {!isAuthenticated ? (
                  <EmptyState
                    icon={<Users className="h-6 w-6" />}
                    title="Log in to see your contests"
                    message="Track your registrations and contest history once you're signed in."
                    action={
                      <Link
                        href={`/accounts/login?redirect=${encodeURIComponent('/contests')}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-inverse hover:opacity-90"
                      >
                        <Sparkles className="h-4 w-4" />
                        Log in
                      </Link>
                    }
                  />
                ) : myLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <MyContestSkeleton key={i} />
                    ))}
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
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-primary bg-elevated px-4 py-3 transition-all hover:border-brand/40"
                      >
                        <div className="min-w-0 flex-1">
                          <Link href={`/contests/${c._id}`} className="block truncate text-sm font-semibold text-primary hover:underline">
                            {c.title}
                          </Link>
                          <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-tertiary">
                            <span>{formatDate(c.startTime)}</span>
                            <span
                              className={`font-medium capitalize ${
                                c.status === 'running' ? 'text-success' : c.status === 'upcoming' ? 'text-brand' : 'text-tertiary'
                              }`}
                            >
                              {c.status === 'running' ? '● Live' : c.status}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/contests/${c._id}`}
                          className="shrink-0 rounded-lg border border-border-primary bg-secondary px-3 py-1.5 text-xs font-medium text-secondary transition-opacity hover:opacity-80"
                        >
                          {c.status === 'running' ? 'Enter' : c.status === 'upcoming' ? 'View' : 'Results'}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Past Contests panel */}
            {activeTab === 'past' && (
              <div>
                <SectionHeader icon={<History className="h-5 w-5" />} title="Past Contests" count={pastLoaded ? pastTotal : undefined} />
                {pastError && <ErrorBanner message={pastError} />}
                {pastLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <PastContestSkeleton key={i} />
                    ))}
                  </div>
                ) : pastContests.length === 0 ? (
                  <EmptyState
                    icon={<History className="h-6 w-6" />}
                    title="No past contests yet"
                    message="Once contests finish, their problems gradually unlock on the Problems page for practice."
                    action={
                      <Link
                        href="/problems"
                        className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-inverse hover:opacity-90"
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
                      <p className="mt-3 text-center text-xs text-tertiary">
                        Showing {pastContests.length} of {pastTotal} contests
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.section>
      </div>

      <Footer />
    </div>
  );
}
