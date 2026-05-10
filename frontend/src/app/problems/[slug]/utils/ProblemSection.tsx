'use client'

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";

export default function ProblemSection() {
  const { slug } = useParams();
  const pathname = usePathname();
  const UserStatus = useSelector((state: RootState) => state.problem.userStatus);
  
  // State for dynamic submission tab - only shows temporarily
  const [submissionTab, setSubmissionTab] = useState<{
    name: string;
    key: string;
  } | null>(null);
  const [isSubmissionTabActive, setIsSubmissionTabActive] = useState(false);
  const [showSubmissionTab, setShowSubmissionTab] = useState(false);

  // Base navigation items (permanent tabs)
  const baseNavItems = [
    { name: 'Description', href: `/problems/${slug}/description`, key: 'description' },
    { name: 'Editorial', href: `/problems/${slug}/editorial`, key: 'editorial' },
    { name: 'Solutions', href: `/problems/${slug}/solutions`, key: 'solutions' },
    { name: 'Submissions', href: `/problems/${slug}/submissions`, key: 'submissions' },
    { name: 'ChatAI', href: `/problems/${slug}/chatai`, key: 'chatai' },
  ];

  // Listen for submission tab creation events
  useEffect(() => {
    const handleCreateSubmissionTab: EventListener = (evt) => {
      const event = evt as CustomEvent<{ tabName?: string }>;
      // Add null checking for event.detail
      if (!event.detail) {
        return;
      }

      const { tabName } = event.detail;
      
      // Additional validation
      if (!tabName) {
        return;
      }
      
      // Create temporary submission tab
      setSubmissionTab({
        name: tabName,
        key: 'submission-result'
      });
      
      // Show the tab and make it active
      setShowSubmissionTab(true);
      setIsSubmissionTabActive(true);
    };

    const handleCloseSubmissionOverlay: EventListener = () => {
      setIsSubmissionTabActive(false);
      // Hide the submission tab completely when closed
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

  // Only include submission tab if it should be shown
  const navItems = (showSubmissionTab && submissionTab) ? [...baseNavItems, submissionTab] : baseNavItems;

  const handleSubmissionTabClick = () => {
    setIsSubmissionTabActive(true);
    
    // Trigger overlay show event for layout (with proper detail data)
    const showOverlayEvent = new CustomEvent('createSubmissionTab', {
      detail: { 
        tabName: submissionTab?.name || 'Submission Result',
        action: 'show'
      }
    });
    window.dispatchEvent(showOverlayEvent);
  };

  const handleRegularTabClick = () => {
    if (isSubmissionTabActive) {
      setIsSubmissionTabActive(false);
      
      // Trigger overlay close event for layout
      const closeOverlayEvent = new CustomEvent('closeSubmissionOverlay');
      window.dispatchEvent(closeOverlayEvent);
    }
  };

  return (
    <div className="bg-elevated border-b border-primary shadow-xs animate-fade-in">
      {/* Navigation Tabs */}
      <div className="flex border-b border-primary bg-secondary px-4 overflow-x-auto">
        {baseNavItems.map((item) => {
          const isActive = pathname.includes(item.key) && !isSubmissionTabActive;
          
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={handleRegularTabClick}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap interactive ${
                isActive
                  ? 'border-brand text-brand bg-elevated shadow-xs'
                  : 'border-transparent text-secondary hover:text-primary hover:border-secondary hover:bg-tertiary'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
        
        {/* Temporary Submission Tab - only shows when needed */}
        {showSubmissionTab && submissionTab && (
          <button
            onClick={handleSubmissionTabClick}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap interactive flex items-center animate-slide-up ${
              isSubmissionTabActive
                ? 'border-brand text-brand bg-elevated shadow-xs'
                : 'border-transparent text-secondary hover:text-primary hover:border-secondary hover:bg-tertiary'
            }`}
          >
            <span>{submissionTab.name}</span>
            {/* Close indicator with better styling */}
            <span className="ml-2 text-xs text-muted hover:text-error transition-colors duration-200 cursor-pointer">
              ×
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
