import React from 'react';
import { ProblemsFilters } from './types';

interface FilterSidebarProps {
  filters: ProblemsFilters;
  onFilterChange: (key: keyof ProblemsFilters, value: string) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFilterChange
}) => {
  const handleClearFilters = () => {
    onFilterChange('difficulty', '');
    onFilterChange('status', '');
    onFilterChange('type', '');
  };

  return (
    <div className="w-full h-full bg-elevated border-r border-primary overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-primary">
          <h3 className="text-lg font-semibold text-primary">Filters</h3>
          <button
            onClick={handleClearFilters}
            className="text-sm text-brand hover:text-brand-hover transition-colors duration-200 font-medium px-3 py-1 rounded-lg hover:bg-tertiary"
          >
            Clear All
          </button>
        </div>

        {/* Difficulty Filter */}
        <div className="mb-8 animate-fade-in">
          <label className="block text-sm font-medium text-primary mb-3">
            Difficulty
          </label>
          <div className="relative">
            <select
              value={filters.difficulty || ''}
              onChange={(e) => onFilterChange('difficulty', e.target.value)}
              className="input appearance-none pr-10 cursor-pointer hover:border-focus transition-all duration-200"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-4 w-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <label className="block text-sm font-medium text-primary mb-3">
            Status
          </label>
          <div className="relative">
            <select
              value={filters.status || ''}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="input appearance-none pr-10 cursor-pointer hover:border-focus transition-all duration-200"
            >
              <option value="">All Problems</option>
              <option value="solved">✅ Solved</option>
              <option value="unsolved">⭕ Unsolved</option>
              <option value="attempted">🔄 Attempted</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-4 w-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Type Filter */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <label className="block text-sm font-medium text-primary mb-3">
            Type
          </label>
          <div className="relative">
            <select
              value={filters.type || ''}
              onChange={(e) => onFilterChange('type', e.target.value)}
              className="input appearance-none pr-10 cursor-pointer hover:border-focus transition-all duration-200"
            >
              <option value="">All Types</option>
              <option value="free">🆓 Free</option>
              <option value="premium">👑 Premium</option>
              <option value="saved">⭐ Saved</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-4 w-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.difficulty || filters.status || filters.type) && (
          <div className="animate-slide-up">
            <h4 className="text-sm font-medium text-primary mb-3">Active Filters</h4>
            <div className="space-y-2">
              {filters.difficulty && (
                <div className="flex items-center justify-between bg-success-light text-success px-3 py-2 rounded-lg border border-success/20 animate-fade-in">
                  <span className="text-sm font-medium">
                    Difficulty: <span className="capitalize">{filters.difficulty}</span>
                  </span>
                  <button
                    onClick={() => onFilterChange('difficulty', '')}
                    className="ml-2 text-success hover:text-success-600 hover:bg-success/10 rounded-full w-5 h-5 flex items-center justify-center transition-all duration-200"
                  >
                    ×
                  </button>
                </div>
              )}
              {filters.status && (
                <div className="flex items-center justify-between bg-warning-light text-warning px-3 py-2 rounded-lg border border-warning/20 animate-fade-in">
                  <span className="text-sm font-medium">
                    Status: <span className="capitalize">{filters.status}</span>
                  </span>
                  <button
                    onClick={() => onFilterChange('status', '')}
                    className="ml-2 text-warning hover:text-warning-600 hover:bg-warning/10 rounded-full w-5 h-5 flex items-center justify-center transition-all duration-200"
                  >
                    ×
                  </button>
                </div>
              )}
              {filters.type && (
                <div className="flex items-center justify-between bg-tertiary text-brand px-3 py-2 rounded-lg border border-brand/20 animate-fade-in">
                  <span className="text-sm font-medium">
                    Type: <span className="capitalize">{filters.type}</span>
                  </span>
                  <button
                    onClick={() => onFilterChange('type', '')}
                    className="ml-2 text-brand hover:text-brand-hover hover:bg-brand/10 rounded-full w-5 h-5 flex items-center justify-center transition-all duration-200"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter Summary */}
        <div className="mt-8 pt-6 border-t border-primary">
          <div className="bg-tertiary p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-4 w-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-primary">Pro Tip</span>
            </div>
            <p className="text-xs text-secondary">
              Use multiple filters to narrow down problems based on your learning goals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
