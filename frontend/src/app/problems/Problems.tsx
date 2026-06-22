import React, { useState, useEffect, useCallback } from 'react';
import { ProblemsFilters, Problem, Topic, Company, PaginationInfo } from './utils/types';
import { problemsAPI } from './utils/globalAPI';
import TopicsBar from './utils/TopicsBar';
import FilterSidebar from './utils/FilterSidebar';
import CompaniesSidebar from './utils/CompaniesSidebar';
import SearchAndSort from './utils/SearchAndSort';
import ProblemsList from './utils/ProblemsList';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ProblemsPage: React.FC = () => {
  // Component state
  const [problems, setProblems] = useState<Problem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalProblems: 0,
    hasNext: false,
    hasPrev: false
  });
  
  const [filters, setFilters] = useState<ProblemsFilters>({
    page: 1,
    limit: 20,
    sortBy: 'title',
    order: 'asc'
  });

  const [loading, setLoading] = useState({
    problems: false,
    topics: false,
    companies: false
  });

  const [error, setError] = useState<string | null>(null);

  // Filter change handler
  const handleFilterChange = useCallback((key: keyof ProblemsFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset to first page when filters change (except for page changes)
      ...(key !== 'page' && { page: 1 })
    }));
  }, []);

  // Topic selection handler
  const handleTopicSelect = useCallback((topic: string) => {
    setFilters(prev => ({
      ...prev,
      topic: topic || undefined,
      page: 1
    }));
  }, []);

  // Company selection handler
  const handleCompanySelect = useCallback((company: string) => {
    setFilters(prev => ({
      ...prev,
      company: company || undefined,
      page: 1
    }));
  }, []);

  // Page change handler
  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
    // Smooth scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Save toggle handler
  const handleSaveToggle = useCallback((problemId: string, isSaved: boolean) => {
    setProblems(prev => 
      prev.map(problem => 
        problem._id === problemId 
          ? { ...problem, isSavedProblem: isSaved }
          : problem
      )
    );
  }, []);

  // Fetch problems with user context
  const fetchProblems = useCallback(async () => {
    setLoading(prev => ({ ...prev, problems: true }));
    setError(null);
    
    try {
      const response = await problemsAPI.getAllProblems(filters);
      setProblems(response.problems);
      setPagination(response.pagination);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch problems');
      } else {
        setError('Failed to fetch problems');
      }
      setProblems([]);
    } finally {
      setLoading(prev => ({ ...prev, problems: false }));
    }
  }, [filters]);

  // Fetch topics
  const fetchTopics = useCallback(async () => {
    setLoading(prev => ({ ...prev, topics: true }));
    
    try {
      const response = await problemsAPI.getAllTopics();
      setTopics(response.topics);
    } catch (err) {
    } finally {
      setLoading(prev => ({ ...prev, topics: false }));
    }
  }, []);

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    setLoading(prev => ({ ...prev, companies: true }));
    
    try {
      const response = await problemsAPI.getAllCompanies();
      setCompanies(response.companies);
    } catch (err) {
    } finally {
      setLoading(prev => ({ ...prev, companies: false }));
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchTopics();
    fetchCompanies();
  }, [fetchTopics, fetchCompanies]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // Error display
  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] flex items-center justify-center animate-fade-in">
        <div className="bg-[var(--card)] rounded-2xl max-w-md w-full mx-4 p-8 border border-[var(--border)]">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto bg-[var(--destructive)]/10 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-[var(--destructive)]" />
            </div>
          </div>

          <h3 className="text-lg font-bold text-[var(--foreground)] text-center mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] text-center mb-6 leading-relaxed">{error}</p>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setError(null);
                fetchProblems();
                fetchTopics();
                fetchCompanies();
              }}
              className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-[var(--primary)] text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => setError(null)}
              className="w-full rounded-lg bg-[var(--muted)] text-[var(--foreground)] text-sm font-medium py-2.5 hover:bg-[var(--muted)]/70 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--background)] overflow-hidden">
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Left Sidebar - Filters */}
        <aside className="w-64 flex-shrink-0 animate-slide-up hidden lg:block" style={{ animationDelay: '0.1s' }}>
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </aside>

        {/* Middle Column - Main Content */}
        <div className="flex-1 flex flex-col min-w-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {/* Page heading */}
          <div className="px-6 pt-5 pb-3 flex items-baseline gap-3">
            <h1 className="text-xl font-bold text-[var(--foreground)]">Problems</h1>
            <span className="text-sm text-[var(--muted-foreground)]">
              {pagination.totalProblems.toLocaleString()} total
            </span>
          </div>

          {/* Topics Bar */}
          <TopicsBar
            topics={topics}
            selectedTopic={filters.topic || ''}
            totalProblems={pagination.totalProblems}
            onTopicSelect={handleTopicSelect}
            isLoading={loading.topics}
          />

          {/* Search and Sort */}
          <SearchAndSort
            filters={filters}
            onFilterChange={handleFilterChange}
            totalProblems={pagination.totalProblems}
          />

          {/* Problems List */}
          <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-tertiary scrollbar-track-transparent">
            <ProblemsList
              problems={problems}
              pagination={pagination}
              isLoading={loading.problems}
              onPageChange={handlePageChange}
              onSaveToggle={handleSaveToggle}
            />
          </div>
        </div>

        {/* Right Sidebar - Companies */}
        <aside className="w-64 flex-shrink-0 animate-slide-up hidden xl:block" style={{ animationDelay: '0.3s' }}>
          <CompaniesSidebar
            companies={companies}
            selectedCompany={filters.company || ''}
            onCompanySelect={handleCompanySelect}
            isLoading={loading.companies}
          />
        </aside>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        .scrollbar-thumb-tertiary::-webkit-scrollbar-thumb {
          background-color: var(--text-tertiary);
          border-radius: 9999px;
        }
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background-color: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
      `}</style>
    </div>
  );
};

export default ProblemsPage;
