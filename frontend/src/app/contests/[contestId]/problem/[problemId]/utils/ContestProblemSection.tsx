'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useContestProblem } from '../ContestProblemContext';

export default function ContestProblemSection() {
  const { contestId, problemId } = useContestProblem();
  const pathname = usePathname();
  const [submissionTab, setSubmissionTab] = useState<{ name: string; key: string } | null>(null);
  const [isSubmissionTabActive, setIsSubmissionTabActive] = useState(false);
  const [showSubmissionTab, setShowSubmissionTab] = useState(false);

  const descriptionHref = `/contests/${contestId}/problem/${problemId}/description`;

  useEffect(() => {
    const handleCreateSubmissionTab: EventListener = (evt) => {
      const event = evt as CustomEvent<{ tabName?: string }>;
      if (!event.detail?.tabName) return;
      setSubmissionTab({ name: event.detail.tabName, key: 'submission-result' });
      setShowSubmissionTab(true);
      setIsSubmissionTabActive(true);
    };
    const handleCloseSubmissionOverlay: EventListener = () => {
      setIsSubmissionTabActive(false);
      setShowSubmissionTab(false);
      setSubmissionTab(null);
    };
    window.addEventListener('createSubmissionTab', handleCreateSubmissionTab);
    window.addEventListener('closeSubmissionOverlay', handleCloseSubmissionOverlay);
    return () => {
      window.removeEventListener('createSubmissionTab', handleCreateSubmissionTab);
      window.removeEventListener('closeSubmissionOverlay', handleCloseSubmissionOverlay);
    };
  }, []);

  const handleSubmissionTabClick = () => {
    setIsSubmissionTabActive(true);
    window.dispatchEvent(new CustomEvent('createSubmissionTab', { detail: { tabName: submissionTab?.name || 'Submission Result' } }));
  };

  const handleRegularTabClick = () => {
    if (isSubmissionTabActive) {
      setIsSubmissionTabActive(false);
      window.dispatchEvent(new CustomEvent('closeSubmissionOverlay'));
    }
  };

  const isDescriptionActive = pathname?.includes('/description') && !isSubmissionTabActive;

  return (
    <div className="bg-elevated border-b border-primary shadow-xs animate-fade-in">
      <div className="flex border-b border-primary bg-secondary px-4 overflow-x-auto">
        <Link
          href={descriptionHref}
          onClick={handleRegularTabClick}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap interactive ${
            isDescriptionActive ? 'border-brand text-brand bg-elevated shadow-xs' : 'border-transparent text-secondary hover:text-primary hover:border-secondary hover:bg-tertiary'
          }`}
        >
          Description
        </Link>
        {showSubmissionTab && submissionTab && (
          <button
            type="button"
            onClick={handleSubmissionTabClick}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap interactive flex items-center ${
              isSubmissionTabActive ? 'border-brand text-brand bg-elevated shadow-xs' : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <span>{submissionTab.name}</span>
            <span className="ml-2 text-xs text-muted">×</span>
          </button>
        )}
      </div>
    </div>
  );
}
