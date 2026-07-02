import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Problem } from './types';
import { problemsAPI } from './globalAPI';
import PremiumModal from '../../components/PremiumModal';
import { RootState } from './types';
import {
  CheckCircle2, Circle, Clock, Bookmark, BookmarkCheck, Loader2, Lock,
} from 'lucide-react';

interface ProblemItemProps {
  problem: Problem;
  index: number;
  onSaveToggle: (problemId: string, isSaved: boolean) => void;
}

const difficultyConfig: Record<string, { label: string; className: string }> = {
  easy:   { label: 'Easy',   className: 'text-difficulty-easy bg-difficulty-easy/10' },
  medium: { label: 'Medium', className: 'text-difficulty-medium bg-difficulty-medium/10' },
  hard:   { label: 'Hard',   className: 'text-difficulty-hard bg-difficulty-hard/10' },
};

const ProblemItem: React.FC<ProblemItemProps> = ({ problem, index, onSaveToggle }) => {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasPremiumAccess = user?.subscriptionType === 'premium';
  const isLocked = problem.isPremiumProblem && !hasPremiumAccess;
  const diff = difficultyConfig[problem.difficulty] ?? { label: problem.difficulty, className: 'text-[var(--muted-foreground)] bg-[var(--muted)]' };

  const handleProblemClick = () => {
    if (isLocked) {
      setShowPremiumModal(true);
      return;
    }
    router.push(`/problems/${problem.slug}`);
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push(`/accounts/login?redirect=${encodeURIComponent('/problems')}`);
      return;
    }
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

  return (
    <>
      <div
        onClick={handleProblemClick}
        className={`group flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--muted)]/60 transition-colors duration-150 cursor-pointer ${isLocked ? 'opacity-75' : ''}`}
      >
        {/* Row number */}
        <span className="w-7 text-right text-xs text-[var(--muted-foreground)] font-mono shrink-0 tabular-nums">
          {index + 1}
        </span>

        {/* Status icon */}
        <div className="shrink-0 w-5 flex items-center justify-center">
          {problem.isSolvedByUser ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : problem.isAttemptedByUser ? (
            <Clock className="w-4 h-4 text-warning" />
          ) : (
            <Circle className="w-4 h-4 text-[var(--border)] opacity-60" />
          )}
        </div>

        {/* Title + badges */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span
            className={`text-sm font-medium truncate transition-colors duration-150 ${
              isLocked
                ? 'text-[var(--muted-foreground)] group-hover:text-warning'
                : 'text-[var(--foreground)] group-hover:text-[var(--primary)]'
            }`}
          >
            {problem.title}
          </span>

          {problem.isPremiumProblem && (
            <span
              className={`shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                hasPremiumAccess
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'bg-warning/10 text-warning'
              }`}
            >
              {!hasPremiumAccess && <Lock className="w-2.5 h-2.5" />}
              PRO
            </span>
          )}
        </div>

        {/* Acceptance rate */}
        <span className="shrink-0 w-16 text-right text-xs text-[var(--muted-foreground)] font-mono tabular-nums">
          {problem.acceptanceRate.toFixed(1)}%
        </span>

        {/* Difficulty badge */}
        <span
          className={`shrink-0 w-[4.5rem] text-center text-[11px] font-semibold px-2.5 py-1 rounded-full ${diff.className}`}
        >
          {diff.label}
        </span>

        {/* Save button */}
        <button
          onClick={handleSaveToggle}
          disabled={isSaving}
          className={`shrink-0 w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg transition-all duration-150 ${
            problem.isSavedProblem
              ? 'text-[var(--primary)] opacity-90 hover:opacity-100 hover:bg-[var(--primary)]/10'
              : 'text-[var(--muted-foreground)] opacity-60 sm:opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-[var(--primary)] hover:bg-[var(--primary)]/10'
          } ${isSaving ? 'cursor-not-allowed' : ''}`}
          title={problem.isSavedProblem ? 'Unsave' : 'Save'}
          aria-label={problem.isSavedProblem ? 'Unsave problem' : 'Save problem'}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : problem.isSavedProblem ? (
            <BookmarkCheck className="w-4 h-4" />
          ) : (
            <Bookmark className="w-4 h-4" />
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
