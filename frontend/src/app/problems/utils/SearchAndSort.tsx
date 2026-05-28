import React, { useState, useEffect } from 'react';
import { ProblemsFilters } from './types';
import { Search, X, ArrowUpAZ, ArrowDownAZ, ArrowUpDown } from 'lucide-react';

interface SearchAndSortProps {
  filters: ProblemsFilters;
  onFilterChange: (key: keyof ProblemsFilters, value: string) => void;
  totalProblems: number;
}

const SORT_OPTIONS = [
  { value: 'title', label: 'Title' },
  { value: 'difficulty', label: 'Difficulty' },
  { value: 'acceptance', label: 'Acceptance' },
  { value: 'created', label: 'Date' },
];

const SearchAndSort: React.FC<SearchAndSortProps> = ({
  filters,
  onFilterChange,
  totalProblems,
}) => {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    const id = setTimeout(() => onFilterChange('search', searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput, onFilterChange]);

  const handleOrderChange = () => {
    onFilterChange('order', filters.order === 'asc' ? 'desc' : 'asc');
  };

  const clearSearch = () => {
    setSearchInput('');
    onFilterChange('search', '');
  };

  return (
    <div className="bg-[var(--card)] border-b border-[var(--border)] px-4 py-2.5">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search problems..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input pl-9 pr-8 py-2 text-sm w-full"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Count */}
        <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap shrink-0 font-medium">
          {totalProblems.toLocaleString()} problems
        </span>

        {/* Sort By */}
        <div className="relative shrink-0">
          <select
            value={filters.sortBy || 'title'}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            className="input py-1.5 pl-3 pr-7 text-xs appearance-none cursor-pointer bg-[var(--secondary)] hover:bg-[var(--accent)] transition-colors font-medium"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--muted-foreground)] pointer-events-none" />
        </div>

        {/* Order toggle */}
        <button
          onClick={handleOrderChange}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[var(--secondary)] hover:bg-[var(--accent)] border border-[var(--border)] rounded-lg text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-all duration-150 font-medium"
          title={`Sort ${filters.order === 'asc' ? 'Descending' : 'Ascending'}`}
        >
          {filters.order === 'asc' ? (
            <ArrowUpAZ className="w-3.5 h-3.5" />
          ) : (
            <ArrowDownAZ className="w-3.5 h-3.5" />
          )}
          {filters.order === 'asc' ? 'A→Z' : 'Z→A'}
        </button>
      </div>
    </div>
  );
};

export default SearchAndSort;
