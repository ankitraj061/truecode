import React, { useState, useEffect } from 'react';
import { ProblemsFilters } from './types';

interface SearchAndSortProps {
  filters: ProblemsFilters;
  onFilterChange: (key: keyof ProblemsFilters, value: string) => void;
  totalProblems: number;
}

const SearchAndSort: React.FC<SearchAndSortProps> = ({
  filters,
  onFilterChange,
  totalProblems
}) => {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFilterChange('search', searchInput);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput, onFilterChange]);

  const handleSortChange = (sortBy: string) => {
    onFilterChange('sortBy', sortBy);
  };

  const handleOrderChange = () => {
    const newOrder = filters.order === 'asc' ? 'desc' : 'asc';
    onFilterChange('order', newOrder);
  };

  const clearSearch = () => {
    setSearchInput('');
    onFilterChange('search', '');
  };

  return (
    <div className="bg-elevated border-b border-primary px-4 py-2.5">
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search problems..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input pl-10 pr-8 py-2 text-sm w-full"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-error transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Results Count */}
        <span className="text-xs text-muted whitespace-nowrap shrink-0">
          {totalProblems.toLocaleString()} problems
        </span>

        {/* Sort By */}
        <div className="relative shrink-0">
          <select
            value={filters.sortBy || 'title'}
            onChange={(e) => handleSortChange(e.target.value)}
            className="input py-1.5 pl-3 pr-8 text-xs appearance-none cursor-pointer bg-secondary"
          >
            <option value="title">Title</option>
            <option value="difficulty">Difficulty</option>
            <option value="acceptance">Acceptance</option>
            <option value="created">Date</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="h-3.5 w-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Sort Order Toggle */}
        <button
          onClick={handleOrderChange}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-tertiary border border-primary rounded-lg text-xs text-secondary hover:text-brand transition-all duration-150"
          title={`Sort ${filters.order === 'asc' ? 'Descending' : 'Ascending'}`}
        >
          {filters.order === 'asc' ? (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            </svg>
          )}
          {filters.order === 'asc' ? 'A→Z' : 'Z→A'}
        </button>
      </div>
    </div>
  );
};

export default SearchAndSort;
