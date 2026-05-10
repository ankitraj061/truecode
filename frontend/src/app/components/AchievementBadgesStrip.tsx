'use client';

import { FiAward } from 'react-icons/fi';

const BADGES = [
  {
    name: 'First Solve',
    short: 'Solve 1 problem',
    iconUrl:
      'https://ik.imagekit.io/tvz1mupab/firstSolve.png?updatedAt=1760933577260',
  },
  {
    name: 'Problem Solver',
    short: 'Solve 10 problems',
    iconUrl:
      'https://ik.imagekit.io/tvz1mupab/problemSolver.png?updatedAt=1760933649100',
  },
  {
    name: 'Coding Enthusiast',
    short: 'Solve 50 problems',
    iconUrl:
      'https://ik.imagekit.io/tvz1mupab/codingEnthusiast.png?updatedAt=1760932933830',
  },
  {
    name: 'Century Club',
    short: 'Solve 100 problems',
    iconUrl:
      'https://ik.imagekit.io/tvz1mupab/centuryClub.png?updatedAt=1760933703775',
  },
  {
    name: 'Week Warrior',
    short: '7‑day streak',
    iconUrl:
      'https://ik.imagekit.io/tvz1mupab/weeklyWarrior.png?updatedAt=1760933522731',
  },
  {
    name: 'Monthly Master',
    short: '30‑day streak',
    iconUrl:
      'https://ik.imagekit.io/tvz1mupab/monthlyMaster.png?updatedAt=1760932393464',
  },
  {
    name: 'Yearly Champion',
    short: '365‑day streak',
    iconUrl:
      'https://ik.imagekit.io/tvz1mupab/yearlyChampion.png?updatedAt=1760933438382',
  },
];

export function AchievementBadgesStrip() {
  return (
    <section className="mt-10 rounded-2xl border border-border-primary bg-elevated/80 px-4 py-4 md:px-6 md:py-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10">
            <FiAward className="h-5 w-5 text-brand" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Achievement badges</p>
            <p className="text-xs text-secondary">
              Earn badges automatically as you solve problems and keep your streak.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 overflow-x-auto pb-2">
        {BADGES.map((badge) => (
          <div
            key={badge.name}
            className="flex flex-col items-center rounded-2xl border border-border-primary/60 bg-primary px-4 py-3 min-w-[280px] md:min-w-[360px]"
          >
            <div className="overflow-hidden rounded-2xl border border-border-primary/80 flex-shrink-0 w-[260px] h-[260px] md:w-[360px] md:h-[360px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              {badge.iconUrl ? (
                <img
                  src={badge.iconUrl}
                  alt={badge.name}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary">
                  <FiAward className="h-10 w-10 text-tertiary" />
                </div>
              )}
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm font-semibold text-primary">{badge.name}</p>
              <p className="text-xs text-tertiary mt-0.5">{badge.short}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

