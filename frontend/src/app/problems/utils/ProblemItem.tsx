import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Problem } from './types';
import { problemsAPI } from './globalAPI';
import PremiumModal from '../../components/PremiumModal';
import { RootState } from './types';

interface ProblemItemProps {
  problem: Problem;
  index: number;
  onSaveToggle: (problemId: string, isSaved: boolean) => void;
}

const ProblemItem: React.FC<ProblemItemProps> = ({ problem, index, onSaveToggle }) => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasPremiumAccess = user?.subscriptionType === 'premium';

  const difficultyStyle: Record<string, string> = {
    easy:   'text-success bg-success-light',
    medium: 'text-warning bg-warning-light',
    hard:   'text-error   bg-error-light',
  };

  const handleProblemClick = () => {
    if (problem.isPremiumProblem && !hasPremiumAccess) {
      setShowPremiumModal(true);
      return;
    }
    router.push(`/problems/${problem.slug}`);
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const response = await problemsAPI.toggleSaveProblem(problem._id);
      onSaveToggle(problem._id, response.isSaved);
    } catch {
    } finally {
      setIsSaving(false);
    }
  };

  const isLocked = problem.isPremiumProblem && !hasPremiumAccess;

  return (
    <>
      <div
        onClick={handleProblemClick}
        className={`
          group flex items-center gap-4 px-4 py-3
          border-b border-primary last:border-b-0
          hover:bg-secondary transition-colors duration-150 cursor-pointer
          ${isLocked ? 'opacity-70' : ''}
        `}
      >
        {/* Row number */}
        <span className="w-8 text-right text-xs text-muted font-mono shrink-0">
          {index + 1}
        </span>

        {/* Status indicator */}
        <div className="shrink-0 w-4 flex items-center justify-center">
          {problem.isSolvedByUser ? (
            <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          ) : problem.isAttemptedByUser ? (
            <div className="w-3 h-3 rounded-full border-2 border-warning" />
          ) : (
            <div className="w-3 h-3 rounded-full border-2 border-primary opacity-40" />
          )}
        </div>

        {/* Title + premium badge */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className={`text-sm font-medium truncate transition-colors duration-150 ${
            isLocked
              ? 'text-muted group-hover:text-warning'
              : 'text-primary group-hover:text-brand'
          }`}>
            {problem.title}
          </span>

          {problem.isPremiumProblem && (
            <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              hasPremiumAccess
                ? 'bg-brand/10 text-brand'
                : 'bg-warning/10 text-warning'
            }`}>
              {hasPremiumAccess ? 'PRO' : '🔒 PRO'}
            </span>
          )}

          {problem.isSavedProblem && (
            <svg className="shrink-0 w-3 h-3 text-brand opacity-60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
          )}
        </div>

        {/* Acceptance rate */}
        <span className="shrink-0 w-16 text-right text-xs text-muted font-mono">
          {problem.acceptanceRate.toFixed(1)}%
        </span>

        {/* Difficulty */}
        <span className={`shrink-0 w-20 text-center text-xs font-semibold px-2.5 py-1 rounded-full ${
          difficultyStyle[problem.difficulty] ?? 'text-muted bg-secondary'
        }`}>
          {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
        </span>

        {/* Save button */}
        <button
          onClick={handleSaveToggle}
          disabled={isSaving}
          className={`shrink-0 w-7 h-7 flex items-center justify-center rounded transition-all duration-150 ${
            problem.isSavedProblem
              ? 'text-brand opacity-80 hover:opacity-100'
              : 'text-muted opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-brand'
          } ${isSaving ? 'cursor-not-allowed' : ''}`}
          title={problem.isSavedProblem ? 'Unsave' : 'Save'}
        >
          {isSaving ? (
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : problem.isSavedProblem ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
          )}
        </button>
      </div>

      {!hasPremiumAccess && (
        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          problemTitle={problem.title}
        />
      )}
    </>
  );
};

export default ProblemItem;
