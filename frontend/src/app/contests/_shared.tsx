'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Crown, Medal, Award } from 'lucide-react';
import type { LeaderboardEntry } from '@/app/utils/contestAPI';

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

/** Live-ticking countdown — takes `now` explicitly so callers can share one clock. */
export function formatCountdown(targetIso: string, now: Date, mode: 'start' | 'end'): string {
  const diff = new Date(targetIso).getTime() - now.getTime();

  if (mode === 'end') {
    if (diff <= 0) return 'Ended';
    const totalSecs = Math.floor(diff / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  if (diff <= 0) return 'Starting soon';
  const totalSecs = Math.floor(diff / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m ${pad(secs)}s`;
}

/** One shared clock for a page — avoids N intervals for N countdown consumers. */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function getInitials(entry: LeaderboardEntry): string {
  return entry.username.slice(0, 2).toUpperCase();
}

export function PodiumCard({ entry, position }: { entry: LeaderboardEntry; position: 1 | 2 | 3 }) {
  const isFirst = position === 1;

  const cfg = {
    1: {
      ring: 'border-yellow-400/40',
      grad: 'bg-gradient-to-b from-yellow-400/10 to-elevated',
      text: 'text-yellow-500',
      avatarBg: 'bg-yellow-400/15',
      icon: <Crown className="mb-2 h-6 w-6 text-yellow-500" />,
    },
    2: {
      ring: 'border-slate-400/35',
      grad: 'bg-elevated',
      text: 'text-slate-400',
      avatarBg: 'bg-slate-400/15',
      icon: <Medal className="mb-2 h-5 w-5 text-slate-400" />,
    },
    3: {
      ring: 'border-orange-400/35',
      grad: 'bg-elevated',
      text: 'text-orange-400',
      avatarBg: 'bg-orange-400/15',
      icon: <Award className="mb-2 h-5 w-5 text-orange-400" />,
    },
  }[position];

  return (
    <Link
      href={`/user/${entry.username}`}
      className={`flex flex-col items-center rounded-2xl border text-center transition-all duration-200 hover:scale-105 hover:shadow-lg ${cfg.ring} ${cfg.grad} ${
        isFirst ? 'min-w-[110px] py-6 sm:min-w-[160px]' : 'min-w-[92px] py-4 sm:min-w-[130px]'
      }`}
    >
      {cfg.icon}
      <div
        className={`flex items-center justify-center rounded-full border-2 font-bold ${cfg.ring} ${cfg.avatarBg} ${cfg.text} ${
          isFirst ? 'mb-2 h-14 w-14 text-base' : 'mb-1.5 h-11 w-11 text-sm'
        }`}
      >
        {getInitials(entry)}
      </div>
      <span className={`max-w-[120px] truncate font-semibold text-primary ${isFirst ? 'text-base' : 'text-sm'}`}>
        {entry.username}
      </span>
      <span className={`mt-0.5 text-xs font-medium ${cfg.text}`}>#{position}</span>
      <div className="mt-2 text-xs text-secondary">
        <span className="font-semibold text-primary">{entry.score}</span> pts
      </div>
      <div className="text-[11px] text-tertiary">{entry.solvedProblems.length} solved</div>
    </Link>
  );
}

export function PodiumRow({ podium }: { podium: LeaderboardEntry[] }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-center gap-2 sm:gap-3">
      {podium[1] && (
        <div className="flex flex-col items-center">
          <PodiumCard entry={podium[1]} position={2} />
          <div className="mt-0 h-8 w-full min-w-[92px] rounded-b-lg bg-slate-400/15 sm:min-w-[110px]" />
        </div>
      )}
      {podium[0] && (
        <div className="flex flex-col items-center">
          <PodiumCard entry={podium[0]} position={1} />
          <div className="h-12 w-full min-w-[110px] rounded-b-lg bg-yellow-400/15 sm:min-w-[130px]" />
        </div>
      )}
      {podium[2] && (
        <div className="flex flex-col items-center">
          <PodiumCard entry={podium[2]} position={3} />
          <div className="h-5 w-full min-w-[92px] rounded-b-lg bg-orange-400/15 sm:min-w-[110px]" />
        </div>
      )}
    </div>
  );
}
