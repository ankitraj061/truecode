import React from 'react';
import { ProblemsFilters } from './types';
import {
  BarChart3, CheckCircle2, Circle, RefreshCw,
  Unlock, Lock, Bookmark, SlidersHorizontal, X,
} from 'lucide-react';

interface FilterSidebarProps {
  filters: ProblemsFilters;
  onFilterChange: (key: keyof ProblemsFilters, value: string) => void;
}

// ── Pill group for a filter category ─────────────────────────
function PillGroup<T extends string>({
  label,
  icon: Icon,
  options,
  value,
  onChange,
}: {
  label: string;
  icon: React.ElementType;
  options: { value: T; label: string; icon?: React.ElementType; activeClass: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[var(--muted-foreground)]" />
        <span className="text-sm font-semibold text-[var(--foreground)]">{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* "All" pill */}
        <button
          onClick={() => onChange('')}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-150 ${
            value === ''
              ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm'
              : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]'
          }`}
        >
          All
        </button>

        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(active ? '' : opt.value)}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-150 ${
                active
                  ? `${opt.activeClass} shadow-sm`
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]'
              }`}
            >
              {opt.icon && <opt.icon className="w-3 h-3" />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────
const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, onFilterChange }) => {
  const activeCount = [filters.difficulty, filters.status, filters.type].filter(Boolean).length;

  const handleClearFilters = () => {
    onFilterChange('difficulty', '');
    onFilterChange('status', '');
    onFilterChange('type', '');
  };

  return (
    <div className="w-full h-full bg-[var(--card)] border-r border-[var(--border)] overflow-y-auto">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-base font-bold text-[var(--foreground)]">Filters</h3>
            {activeCount > 0 && (
              <span className="text-[10px] font-bold bg-[var(--primary)] text-white rounded-full w-4 h-4 flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </div>
          {activeCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors duration-150 font-medium"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {/* Difficulty */}
        <PillGroup
          label="Difficulty"
          icon={BarChart3}
          value={filters.difficulty || ''}
          onChange={(v) => onFilterChange('difficulty', v)}
          options={[
            {
              value: 'easy',
              label: 'Easy',
              activeClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40 dark:text-emerald-400',
            },
            {
              value: 'medium',
              label: 'Medium',
              activeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/40 dark:text-amber-400',
            },
            {
              value: 'hard',
              label: 'Hard',
              activeClass: 'bg-rose-500/15 text-rose-600 border-rose-500/40 dark:text-rose-400',
            },
          ]}
        />

        {/* Status */}
        <PillGroup
          label="Status"
          icon={CheckCircle2}
          value={filters.status || ''}
          onChange={(v) => onFilterChange('status', v)}
          options={[
            {
              value: 'solved',
              label: 'Solved',
              icon: CheckCircle2,
              activeClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40 dark:text-emerald-400',
            },
            {
              value: 'unsolved',
              label: 'Unsolved',
              icon: Circle,
              activeClass: 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/40',
            },
            {
              value: 'attempted',
              label: 'Attempted',
              icon: RefreshCw,
              activeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/40 dark:text-amber-400',
            },
          ]}
        />

        {/* Type */}
        <PillGroup
          label="Type"
          icon={Bookmark}
          value={filters.type || ''}
          onChange={(v) => onFilterChange('type', v)}
          options={[
            {
              value: 'free',
              label: 'Free',
              icon: Unlock,
              activeClass: 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/40',
            },
            {
              value: 'premium',
              label: 'Premium',
              icon: Lock,
              activeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/40 dark:text-amber-400',
            },
            {
              value: 'saved',
              label: 'Saved',
              icon: Bookmark,
              activeClass: 'bg-blue-500/15 text-blue-600 border-blue-500/40 dark:text-blue-400',
            },
          ]}
        />

        {/* Pro tip */}
        <div className="mt-4 pt-5 border-t border-[var(--border)]">
          <div className="bg-[var(--muted)]/60 rounded-xl p-4">
            <p className="text-xs font-semibold text-[var(--foreground)] mb-1">Pro Tip</p>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Combine filters to narrow down problems to your exact learning goals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
