import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Company, RootState } from './types';

interface CompaniesSidebarProps {
  companies: Company[];
  selectedCompany: string;
  onCompanySelect: (company: string) => void;
  isLoading: boolean;
}

const CompaniesSidebar: React.FC<CompaniesSidebarProps> = ({
  companies,
  selectedCompany,
  onCompanySelect,
  isLoading
}) => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const hasPremiumAccess = user?.subscriptionType === 'premium';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);

  // Filter companies based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company =>
        company.company.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [companies, searchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  const getTotalProblems = () => {
    return companies.reduce((sum, company) => sum + company.count, 0);
  };

  // Handle company selection with premium check
  const handleCompanyClick = (companyName: string) => {
    if (!hasPremiumAccess) {
      // Redirect to premium page for free users
      router.push('/premium');
      return;
    }

    if (selectedCompany === companyName) {
      // If clicking the same company, clear the selection
      onCompanySelect('');
    } else {
      // Otherwise, select the new company
      onCompanySelect(companyName);
    }
  };

  const handleSubscribe = () => {
    router.push('/premium');
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-elevated border-l border-primary overflow-y-auto">
        <div className="p-6">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="w-32 h-6 skeleton rounded mb-4"></div>
            <div className="w-full h-12 skeleton rounded-xl"></div>
          </div>
          
          {/* Loading Skeletons */}
          <div className="space-y-3">
            {[...Array(12)].map((_, index) => (
              <div
                key={index}
                className="bg-tertiary/20 rounded-xl p-4 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-24 h-4 skeleton rounded"></div>
                  <div className="w-8 h-6 skeleton rounded-full"></div>
                </div>
                <div className="flex gap-1">
                  <div className="w-8 h-4 skeleton rounded"></div>
                  <div className="w-8 h-4 skeleton rounded"></div>
                  <div className="w-8 h-4 skeleton rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-elevated border-l border-primary overflow-y-auto relative">
      {/* Premium Lock Overlay for Free Users */}
      {!hasPremiumAccess && (
        <div className="absolute inset-0 z-10 flex flex-col bg-elevated/95 backdrop-blur-md">
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            {/* Crown icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg mb-4">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2 3a1 1 0 011-1h8a1 1 0 010 2H8a1 1 0 01-1-1z"/>
              </svg>
            </div>
            <h3 className="text-base font-bold text-primary mb-1">Company Filter</h3>
            <p className="text-xs text-secondary mb-5 leading-relaxed">
              Filter problems by top companies like Google, Meta, Amazon and more. Unlock with Premium.
            </p>
            {/* Feature list */}
            <ul className="text-left space-y-2 mb-6 w-full">
              {['Filter by 50+ companies', 'See interview frequency', 'Company-tagged problems', 'Exclusive problem sets'].map(f => (
                <li key={f} className="flex items-center gap-2 text-xs text-secondary">
                  <svg className="w-3.5 h-3.5 text-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={handleSubscribe}
              className="w-full rounded-xl bg-gradient-to-r from-brand to-emerald-500 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity shadow-sm"
            >
              Upgrade to Premium
            </button>
            <p className="text-xs text-tertiary mt-3">Starting at ₹1/month</p>
          </div>
          {/* Blurred preview of companies list underneath */}
        </div>
      )}

      {/* Blurred Content (Always Rendered but Blurred for Free Users) */}
      <div className={`p-6 transition-all duration-300 ${!hasPremiumAccess ? 'blur-sm pointer-events-none' : ''}`}>
        {/* Header */}
        <div className="mb-6 pb-6 border-b border-primary">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              hasPremiumAccess ? 'bg-brand/20' : 'bg-warning/20'
            }`}>
              <svg className={`w-6 h-6 ${hasPremiumAccess ? 'text-brand' : 'text-warning'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                Companies
                {!hasPremiumAccess && (
                  <svg className="w-4 h-4 text-warning" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                )}
              </h3>
              <p className="text-sm text-secondary">
                {hasPremiumAccess ? `${companies.length} organizations` : 'Premium Feature Locked'}
              </p>
            </div>
          </div>
          
          {/* Search Input */}
          <div className="relative group">
            <input
              type="text"
              placeholder={hasPremiumAccess ? "Search companies..." : "Premium required..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!hasPremiumAccess}
              className="input pl-11 pr-11 py-3 text-sm hover:border-focus/50 group-hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          
            {searchTerm && hasPremiumAccess && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-tertiary hover:text-error transition-all duration-200 hover:scale-110"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* All Companies Button */}
        <div className="mb-4 animate-fade-in">
          <button
            onClick={() => hasPremiumAccess && onCompanySelect('')}
            disabled={!hasPremiumAccess}
            className={`w-full group relative overflow-hidden rounded-xl p-4 border-2 transition-all duration-300 hover:scale-102 hover:shadow-lg disabled:cursor-not-allowed ${
              selectedCompany === '' && hasPremiumAccess
                ? 'bg-gradient-to-r from-brand/20 to-brand/10 border-brand text-brand shadow-brand/25'
                : 'bg-tertiary/20 border-tertiary/30 hover:border-brand/50 hover:bg-brand/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  selectedCompany === '' && hasPremiumAccess ? 'bg-brand/30' : 'bg-tertiary/50 group-hover:bg-brand/20'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <span className="font-semibold">All Companies</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                selectedCompany === '' && hasPremiumAccess
                  ? 'bg-brand/30 text-brand' 
                  : 'bg-tertiary/50 text-secondary group-hover:bg-brand/20 group-hover:text-brand'
              }`}>
                {getTotalProblems()}
              </div>
            </div>
            {selectedCompany === '' && hasPremiumAccess && (
              <div className="absolute inset-0 bg-gradient-to-r from-brand/5 to-transparent animate-pulse"></div>
            )}
          </button>
        </div>

        {/* Companies List */}
        <div className="space-y-2">
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-16 h-16 mx-auto bg-tertiary/20 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-secondary font-medium">
                {searchTerm ? 'No companies found' : 'No companies available'}
              </p>
              {searchTerm && hasPremiumAccess && (
                <button
                  onClick={clearSearch}
                  className="mt-3 text-sm text-brand hover:text-brand-hover font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredCompanies.map((company, index) => (
              <div
                key={company.company}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <button
                  onClick={() => handleCompanyClick(company.company)}
                  disabled={!hasPremiumAccess}
                  className={`w-full group relative overflow-hidden rounded-xl p-4 border transition-all duration-300 hover:scale-102 hover:shadow-md disabled:cursor-not-allowed ${
                    selectedCompany === company.company && hasPremiumAccess
                      ? 'bg-gradient-to-r from-brand/20 to-brand/10 border-brand text-brand shadow-brand/20'
                      : 'bg-tertiary/10 border-tertiary/20 hover:border-brand/30 hover:bg-brand/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                        selectedCompany === company.company && hasPremiumAccess
                          ? 'bg-brand/30 text-brand'
                          : 'bg-tertiary/30 text-secondary group-hover:bg-brand/20 group-hover:text-brand'
                      }`}>
                        {company.company.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-sm truncate max-w-[120px]">
                          {company.company}
                        </div>
                        {selectedCompany === company.company && hasPremiumAccess && (
                          <div className="text-xs text-brand/80 mt-1">
                            Click again to clear filter
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      selectedCompany === company.company && hasPremiumAccess
                        ? 'bg-brand/30 text-brand'
                        : 'bg-tertiary/50 text-secondary group-hover:bg-brand/20 group-hover:text-brand'
                    }`}>
                      {company.count}
                    </div>
                  </div>
                  
                  {/* Difficulty Breakdown */}
                  <div className="flex gap-1 justify-center">
                    {company.difficultyBreakdown.easy > 0 && (
                      <div className="flex items-center gap-1 bg-success/20 border border-success/30 text-success px-2 py-1 rounded-md">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <span className="text-xs font-semibold">{company.difficultyBreakdown.easy}</span>
                      </div>
                    )}
                    {company.difficultyBreakdown.medium > 0 && (
                      <div className="flex items-center gap-1 bg-warning/20 border border-warning/30 text-warning px-2 py-1 rounded-md">
                        <div className="w-2 h-2 bg-warning rounded-full"></div>
                        <span className="text-xs font-semibold">{company.difficultyBreakdown.medium}</span>
                      </div>
                    )}
                    {company.difficultyBreakdown.hard > 0 && (
                      <div className="flex items-center gap-1 bg-error/20 border border-error/30 text-error px-2 py-1 rounded-md">
                        <div className="w-2 h-2 bg-error rounded-full"></div>
                        <span className="text-xs font-semibold">{company.difficultyBreakdown.hard}</span>
                      </div>
                    )}
                  </div>

                  {/* Selection Indicator */}
                  {selectedCompany === company.company && hasPremiumAccess && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-brand rounded-full animate-ping"></div>
                      <div className="absolute top-0 right-0 w-3 h-3 bg-brand rounded-full"></div>
                    </div>
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Search Results Info */}
        {searchTerm && hasPremiumAccess && (
          <div className="mt-6 pt-6 border-t border-primary animate-fade-in">
            <div className="bg-tertiary/20 rounded-xl p-4 text-center">
              <div className="text-sm text-secondary">
                <span className="font-medium text-primary">
                  {filteredCompanies.length}
                </span> of <span className="font-medium text-primary">
                  {companies.length}
                </span> companies found
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompaniesSidebar;
