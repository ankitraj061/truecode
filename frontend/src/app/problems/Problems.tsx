import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { ProblemsFilters, Problem, Topic, Company, PaginationInfo, RootState } from './utils/types';
import { problemsAPI } from './utils/globalAPI';
import TopicsBar from './utils/TopicsBar';
import FilterSidebar from './utils/FilterSidebar';
import CompaniesSidebar from './utils/CompaniesSidebar';
import SearchAndSort from './utils/SearchAndSort';
import ProblemsList from './utils/ProblemsList';

const ProblemsPage: React.FC = () => {
  // Redux state
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

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
    if (!isAuthenticated || !user) {
      setError('Please login to access problems');
      return;
    }

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
  }, [filters, isAuthenticated, user]);

  // Fetch topics
  const fetchTopics = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(prev => ({ ...prev, topics: true }));
    
    try {
      const response = await problemsAPI.getAllTopics();
      setTopics(response.topics);
    } catch (err) {
    } finally {
      setLoading(prev => ({ ...prev, topics: false }));
    }
  }, [isAuthenticated]);

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(prev => ({ ...prev, companies: true }));
    
    try {
      const response = await problemsAPI.getAllCompanies();
      setCompanies(response.companies);
    } catch (err) {
    } finally {
      setLoading(prev => ({ ...prev, companies: false }));
    }
  }, [isAuthenticated]);

  // Effects
  useEffect(() => {
    if (isAuthenticated) {
      fetchTopics();
      fetchCompanies();
    }
  }, [fetchTopics, fetchCompanies, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProblems();
    }
  }, [fetchProblems, isAuthenticated]);

  // Authentication check
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center animate-fade-in">
        <div className="bg-elevated rounded-3xl shadow-xl max-w-md w-full mx-4 p-8 border border-primary text-center">
          <div className="w-20 h-20 mx-auto bg-warning/20 rounded-3xl flex items-center justify-center mb-6">
            <svg className="h-10 w-10 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-primary mb-3">
            Authentication Required
          </h3>
          <p className="text-secondary mb-6">
            Please log in to access the problems dashboard and start your coding journey.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="btn-primary w-full hover:scale-105 active:scale-95 transition-all duration-300"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Error display
  if (error) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center animate-fade-in">
        <div className="bg-elevated rounded-3xl shadow-xl max-w-md w-full mx-4 p-8 border border-primary">
          {/* Error Icon */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto bg-error/20 rounded-3xl flex items-center justify-center mb-4 relative">
              <svg className="h-10 w-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-error/30 rounded-full animate-ping"></div>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-primary text-center mb-3">
            Oops! Something went wrong
          </h3>
          <p className="text-secondary text-center mb-6 leading-relaxed">{error}</p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setError(null);
                fetchProblems();
                fetchTopics();
                fetchCompanies();
              }}
              className="btn-primary w-full hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </span>
            </button>
            <button
              onClick={() => setError(null)}
              className="btn-secondary w-full hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary overflow-hidden">
      {/* Welcome Header for First Time Load */}
      {/* {problems.length > 0 && (
        <div className="bg-elevated border-b border-primary p-4 animate-slide-up">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                hasPremiumAccess ? 'bg-success/20' : 'bg-warning/20'
              }`}>
                {hasPremiumAccess ? (
                  <svg className="w-6 h-6 text-success" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary">
                  Welcome back, {user.firstName}! 🚀
                </h1>
                <p className="text-sm text-secondary">
                  {hasPremiumAccess 
                    ? `You have full access to ${pagination.totalProblems} problems` 
                    : `${pagination.totalProblems} problems available • Upgrade for premium content`
                  }
                </p>
              </div>
            </div>
            {!hasPremiumAccess && (
              <button className="bg-gradient-to-r from-warning to-accent text-inverse px-6 py-2 rounded-xl font-medium hover:scale-105 transition-all duration-300">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Upgrade to Premium
                </span>
              </button>
            )}
          </div>
        </div>
      )} */}

      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Left Sidebar - Filters */}
        <div className="w-64 flex-shrink-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Middle Column - Main Content */}
        <div className="flex-1 flex flex-col min-w-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {/* Topics Bar */}
          <TopicsBar
            topics={topics}
            selectedTopic={filters.topic || ''}
            totalProblems ={pagination.totalProblems}
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
        <div className="w-64 flex-shrink-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <CompaniesSidebar
            companies={companies}
            selectedCompany={filters.company || ''}
            onCompanySelect={handleCompanySelect}
            isLoading={loading.companies}
          />
        </div>
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
