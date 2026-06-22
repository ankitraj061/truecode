import React from 'react';
import { Problem, PaginationInfo } from './types';
import ProblemItem from './ProblemItem';
import { ChevronLeft, ChevronRight, FileSearch, SlidersHorizontal } from 'lucide-react';

interface ProblemsListProps {
  problems: Problem[];
  pagination: PaginationInfo;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onSaveToggle: (problemId: string, isSaved: boolean) => void;
}

const ProblemsList: React.FC<ProblemsListProps> = ({
  problems,
  pagination,
  isLoading,
  onPageChange,
  onSaveToggle
}) => {
  if (isLoading) {
    return (
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-[var(--border)] bg-[var(--muted)]/40">
          <div className="w-8 skeleton h-3 rounded" />
          <div className="w-4 skeleton h-3 rounded" />
          <div className="flex-1 skeleton h-3 rounded max-w-[100px]" />
          <div className="w-16 skeleton h-3 rounded" />
          <div className="w-20 skeleton h-3 rounded" />
          <div className="w-7 skeleton h-3 rounded" />
        </div>
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] last:border-b-0">
            <div className="w-8 skeleton h-3 rounded" />
            <div className="w-3 h-3 skeleton rounded-full" />
            <div className="flex-1 skeleton h-4 rounded" style={{ maxWidth: `${180 + (i % 5) * 40}px` }} />
            <div className="w-16 skeleton h-3 rounded" />
            <div className="w-16 h-5 skeleton rounded-full" />
            <div className="w-7 h-7 skeleton rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-xl p-12 text-center border border-[var(--border)] animate-fade-in">
        <div className="w-16 h-16 mx-auto bg-[var(--muted)] rounded-2xl flex items-center justify-center mb-5">
          <FileSearch className="w-8 h-8 text-[var(--muted-foreground)]" />
        </div>
        <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">No problems found</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-5">
          Try adjusting your filters or search criteria.
        </p>
        <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 text-[var(--primary)] px-4 py-2 rounded-full text-xs font-medium">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Clear all filters to see more problems
        </div>
      </div>
    );
  }

  const renderPaginationButton = (page: number | string, isCurrent = false) => {
    if (typeof page === 'string') {
      return (
        <span key={page} className="px-2 text-sm text-[var(--muted-foreground)]">
          {page}
        </span>
      );
    }

    return (
      <button
        key={page}
        onClick={() => !isCurrent && onPageChange(page)}
        disabled={isCurrent}
        className={`min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
          isCurrent
            ? 'bg-[var(--primary)] text-white'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
        }`}
      >
        {page}
      </button>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Problems Table */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        {/* Column header */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-[var(--border)] bg-[var(--muted)]/40">
          <span className="w-7 text-right text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">#</span>
          <span className="w-5" />
          <span className="flex-1 text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Problem</span>
          <span className="w-16 text-right text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Accept%</span>
          <span className="w-[4.5rem] text-center text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Difficulty</span>
          <span className="w-7" />
        </div>

        {problems.map((problem, index) => (
          <ProblemItem
            key={problem._id}
            problem={problem}
            index={index}
            onSaveToggle={onSaveToggle}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
          <div className="text-sm text-[var(--muted-foreground)]">
            Page <span className="font-medium text-[var(--foreground)]">{pagination.currentPage}</span> of{' '}
            <span className="font-medium text-[var(--foreground)]">{pagination.totalPages}</span>
            <span className="hidden sm:inline"> · {pagination.totalProblems.toLocaleString()} problems</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {(() => {
              const pages: (number | string)[] = [];
              const current = pagination.currentPage;
              const total = pagination.totalPages;

              if (current > 3) {
                pages.push(1);
                if (current > 4) pages.push('...');
              }
              for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
                pages.push(i);
              }
              if (current < total - 2) {
                if (current < total - 3) pages.push('...');
                pages.push(total);
              }

              return pages.map((p) => renderPaginationButton(p, p === current));
            })()}

            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemsList;
