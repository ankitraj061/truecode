import React from 'react';
import { Problem, PaginationInfo } from './types';
import ProblemItem from './ProblemItem';

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
      <div className="bg-elevated rounded-lg border border-primary overflow-hidden">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-primary bg-secondary/40">
          <div className="w-8 skeleton h-3 rounded" />
          <div className="w-4 skeleton h-3 rounded" />
          <div className="flex-1 skeleton h-3 rounded max-w-[100px]" />
          <div className="w-16 skeleton h-3 rounded" />
          <div className="w-20 skeleton h-3 rounded" />
          <div className="w-7 skeleton h-3 rounded" />
        </div>
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-primary last:border-b-0">
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
      <div className="bg-elevated rounded-2xl p-12 text-center border border-primary shadow-lg animate-fade-in">
        <div className="relative mb-6">
          <div className="w-24 h-24 mx-auto bg-tertiary/20 rounded-3xl flex items-center justify-center">
            <svg className="w-12 h-12 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand/20 rounded-full animate-ping"></div>
        </div>
        <h3 className="text-2xl font-bold text-primary mb-3">No Problems Found</h3>
        <p className="text-secondary text-lg mb-6">
          Try adjusting your filters or search criteria to discover problems.
        </p>
        <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-6 py-3 rounded-full border border-brand/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Pro Tip: Clear all filters to see more problems</span>
        </div>
      </div>
    );
  }

  const renderPaginationButton = (page: number | string, isCurrent = false, isDisabled = false) => {
    if (typeof page === 'string') {
      return (
        <div
          key={page}
          className="px-3 py-2 text-tertiary cursor-default"
        >
          {page}
        </div>
      );
    }

    return (
      <button
        key={page}
        onClick={() => !isCurrent && !isDisabled && onPageChange(page)}
        disabled={isDisabled || isCurrent}
        className={`relative overflow-hidden px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
          isCurrent
            ? 'bg-brand text-inverse shadow-lg shadow-brand/25 scale-105'
            : isDisabled
            ? 'text-muted cursor-not-allowed'
            : 'text-secondary hover:text-brand hover:bg-brand/10 hover:scale-105 hover:shadow-md active:scale-95'
        }`}
      >
        {isCurrent && (
          <div className="absolute inset-0 bg-gradient-to-r from-brand to-brand-hover opacity-90"></div>
        )}
        <span className="relative">{page}</span>
      </button>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Problems Table */}
      <div className="bg-elevated rounded-lg border border-primary overflow-hidden">
        {/* Column header */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-primary bg-secondary/40">
          <span className="w-8 text-right text-[11px] font-semibold text-muted uppercase tracking-wide">#</span>
          <span className="w-4" />
          <span className="flex-1 text-[11px] font-semibold text-muted uppercase tracking-wide">Problem</span>
          <span className="w-16 text-right text-[11px] font-semibold text-muted uppercase tracking-wide">Accept%</span>
          <span className="w-20 text-center text-[11px] font-semibold text-muted uppercase tracking-wide">Difficulty</span>
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
        <div className="bg-elevated rounded-lg border border-primary p-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Pagination Info */}
            <div className="flex items-center gap-2 text-sm text-secondary">
              <div className="inline-flex items-center gap-2 bg-tertiary px-3 py-2 rounded-lg">
                <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
              </div>
              <div className="text-tertiary">
                ({pagination.totalProblems.toLocaleString()} total problems)
              </div>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  pagination.hasPrev
                    ? 'text-secondary hover:text-brand hover:bg-brand/10 hover:scale-105 hover:shadow-md active:scale-95'
                    : 'text-muted cursor-not-allowed opacity-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {(() => {
                  const pages = [];
                  const current = pagination.currentPage;
                  const total = pagination.totalPages;
                  
                  // Show first page
                  if (current > 3) {
                    pages.push(renderPaginationButton(1));
                    if (current > 4) pages.push('...');
                  }
                  
                  // Show current page and neighbors
                  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
                    pages.push(renderPaginationButton(i, i === current));
                  }
                  
                  // Show last page
                  if (current < total - 2) {
                    if (current < total - 3) pages.push('...');
                    pages.push(renderPaginationButton(total));
                  }
                  
                  return pages;
                })()}
              </div>
              
              {/* Next Button */}
              <button
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  pagination.hasNext
                    ? 'text-secondary hover:text-brand hover:bg-brand/10 hover:scale-105 hover:shadow-md active:scale-95'
                    : 'text-muted cursor-not-allowed opacity-50'
                }`}
              >
                <span>Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemsList;
