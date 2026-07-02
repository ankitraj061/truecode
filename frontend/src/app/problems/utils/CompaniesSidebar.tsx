import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Company, RootState } from './types';
import { Building2, Search, X, Crown, Check } from 'lucide-react';

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

  useEffect(() => {
    if (!searchTerm) {
      setFilteredCompanies(companies);
    } else {
      setFilteredCompanies(
        companies.filter((c) => c.company.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  }, [companies, searchTerm]);

  const getTotalProblems = () => companies.reduce((sum, c) => sum + c.count, 0);

  const handleCompanyClick = (companyName: string) => {
    if (!hasPremiumAccess) {
      router.push('/premium');
      return;
    }
    onCompanySelect(selectedCompany === companyName ? '' : companyName);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto p-5">
        <div className="w-28 h-5 skeleton rounded mb-5" />
        <div className="w-full h-10 skeleton rounded-lg mb-5" />
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="w-full h-12 skeleton rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto relative">
      {/* Premium gate */}
      {!hasPremiumAccess && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-[var(--card)]/95 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4">
            <Crown className="w-6 h-6 text-warning" />
          </div>
          <h3 className="text-sm font-bold text-[var(--foreground)] mb-1.5">Company Filter</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-5 leading-relaxed max-w-[200px]">
            Filter problems by Google, Meta, Amazon and 50+ more companies.
          </p>
          <ul className="text-left space-y-2 mb-5 w-full max-w-[200px]">
            {['See interview frequency', 'Company-tagged problems', 'Exclusive problem sets'].map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <Check className="w-3.5 h-3.5 text-[var(--primary)] flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => router.push('/premium')}
            className="w-full max-w-[200px] rounded-lg bg-[var(--primary)] text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity"
          >
            Upgrade to Premium
          </button>
        </div>
      )}

      <div className={`p-5 ${!hasPremiumAccess ? 'blur-sm pointer-events-none select-none' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-base font-bold text-[var(--foreground)]">Companies</h3>
          </div>
          <span className="text-xs text-[var(--muted-foreground)] font-medium">
            {companies.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!hasPremiumAccess}
            className="input pl-9 pr-8 py-2 text-sm w-full"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* All Companies */}
        <button
          onClick={() => hasPremiumAccess && onCompanySelect('')}
          disabled={!hasPremiumAccess}
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 mb-3 border text-sm font-medium transition-colors duration-150 ${
            selectedCompany === ''
              ? 'bg-[var(--primary)]/10 border-[var(--primary)]/40 text-[var(--primary)]'
              : 'bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/40'
          }`}
        >
          <span>All Companies</span>
          <span className="text-xs font-semibold opacity-70">{getTotalProblems()}</span>
        </button>

        {/* Companies List */}
        <div className="space-y-1.5">
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-10">
              <Search className="w-8 h-8 mx-auto text-[var(--muted-foreground)] opacity-40 mb-3" />
              <p className="text-sm text-[var(--muted-foreground)]">No companies found</p>
            </div>
          ) : (
            filteredCompanies.map((company) => {
              const active = selectedCompany === company.company;
              return (
                <button
                  key={company.company}
                  onClick={() => handleCompanyClick(company.company)}
                  disabled={!hasPremiumAccess}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors duration-150 ${
                    active
                      ? 'bg-[var(--primary)]/10 border-[var(--primary)]/40'
                      : 'bg-transparent border-transparent hover:bg-[var(--muted)]'
                  }`}
                >
                  <div
                    className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      active ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {company.company.charAt(0).toUpperCase()}
                  </div>

                  <span
                    className={`flex-1 text-left text-sm font-medium truncate ${
                      active ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'
                    }`}
                  >
                    {company.company}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {company.difficultyBreakdown.easy > 0 && (
                      <span className="text-[10px] font-semibold text-difficulty-easy">
                        {company.difficultyBreakdown.easy}
                      </span>
                    )}
                    {company.difficultyBreakdown.medium > 0 && (
                      <span className="text-[10px] font-semibold text-difficulty-medium">
                        {company.difficultyBreakdown.medium}
                      </span>
                    )}
                    {company.difficultyBreakdown.hard > 0 && (
                      <span className="text-[10px] font-semibold text-difficulty-hard">
                        {company.difficultyBreakdown.hard}
                      </span>
                    )}
                    <span
                      className={`text-xs font-semibold w-6 text-right ${
                        active ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'
                      }`}
                    >
                      {company.count}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {searchTerm && (
          <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
            {filteredCompanies.length} of {companies.length} companies
          </p>
        )}
      </div>
    </div>
  );
};

export default CompaniesSidebar;
