"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { axiosClient } from "@/app/utils/axiosClient";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store/store";
import PremiumModal from "../../../components/PremiumModal";

interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: string;
  createdAt: string;
  isPremiumProblem: boolean;
  isSavedProblem: boolean;
  isSolvedByUser: boolean;
  isAttemptedByUser: boolean;
  acceptanceRate: number;
}

interface ProblemListSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onProblemSelect: (slug: string) => void;
}

export default function ProblemListSidebar({ isOpen, onClose, onProblemSelect }: ProblemListSidebarProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedPremiumProblem, setSelectedPremiumProblem] = useState<string>("");
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const hasPremium = user?.subscriptionType === "premium";

  useEffect(() => {
    if (isOpen && problems.length === 0) {
      fetchProblems();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        isOpen &&
        !target.closest(".problem-sidebar") &&
        !target.closest(".problem-list-toggle")
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get(
        "/api/user/problem/all?page=1&limit=100&sortBy=title&order=asc"
      );
      if (response.data.success) {
        setProblems(response.data.problems);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const filteredProblems = problems.filter((problem) => {
    const matchesSearch = problem.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDifficulty =
      difficultyFilter === "all" || problem.difficulty === difficultyFilter;

    let matchesStatus = true;
    if (statusFilter === "solved") {
      matchesStatus = problem.isSolvedByUser;
    } else if (statusFilter === "attempted") {
      matchesStatus = problem.isAttemptedByUser && !problem.isSolvedByUser;
    } else if (statusFilter === "todo") {
      matchesStatus = !problem.isSolvedByUser && !problem.isAttemptedByUser;
    }

    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  const handleProblemClick = (problem: Problem) => {
    if (problem.isPremiumProblem && !hasPremium) {
      setSelectedPremiumProblem(problem.title);
      setShowPremiumModal(true);
      return;
    }
    onProblemSelect(problem.slug);
    router.push(`/problems/${problem.slug}/description`);
  };

  const handlePremiumModalClose = () => {
    setShowPremiumModal(false);
    setSelectedPremiumProblem("");
  };

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "text-success bg-success-light";
      case "medium":
        return "text-warning bg-warning-light";
      case "hard":
        return "text-error bg-error-light";
      default:
        return "text-muted bg-tertiary";
    }
  };

  const solvedCount = problems.filter((p) => p.isSolvedByUser).length;
  const progressPct = problems.length > 0 ? (solvedCount / problems.length) * 100 : 0;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <div
        className={`
          problem-sidebar
          fixed top-0 left-0 h-full w-100 z-50
          flex flex-col
          bg-elevated border-r border-primary shadow-xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-primary bg-secondary shrink-0">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-brand"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h2 className="text-sm font-semibold text-primary">Problem List</h2>
            {hasPremium && (
              <span className="text-[10px] bg-brand text-inverse px-2 py-0.5 rounded-full font-semibold tracking-wide">
                PRO
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted hover:text-primary hover:bg-tertiary transition-colors"
            aria-label="Close sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-3 py-3 space-y-2 border-b border-primary bg-secondary shrink-0">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search problems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input text-sm pl-9 py-2"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="input text-sm py-1.5"
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input text-sm py-1.5"
            >
              <option value="all">All Status</option>
              <option value="solved">Solved</option>
              <option value="attempted">Attempted</option>
              <option value="todo">To Do</option>
            </select>
          </div>

          {/* Result count */}
          <p className="text-xs text-muted text-right">
            {filteredProblems.length} of {problems.length} problems
          </p>
        </div>

        {/* Problems List — flex-1 makes it fill remaining height */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="py-3 px-3 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-1 py-2">
                  <div className="skeleton w-6 h-3 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 rounded w-3/4" />
                    <div className="skeleton h-2.5 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-muted">
              <svg className="w-10 h-10 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium text-secondary">No problems found</p>
              {(searchTerm || difficultyFilter !== "all" || statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setDifficultyFilter("all");
                    setStatusFilter("all");
                  }}
                  className="mt-2 text-xs text-brand hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <ul className="py-1">
              {filteredProblems.map((problem, index) => {
                const isActive = problem.slug === slug;
                const isLocked = problem.isPremiumProblem && !hasPremium;

                return (
                  <li key={problem._id}>
                    <button
                      onClick={() => handleProblemClick(problem)}
                      className={`
                        w-full px-3 py-2.5 text-left transition-colors duration-150
                        flex items-start gap-2.5 relative
                        border-l-2
                        ${isActive
                          ? "bg-brand/10 border-l-[var(--primary-500)]"
                          : "border-l-transparent hover:bg-secondary hover:border-l-[var(--border-secondary)]"
                        }
                        ${isLocked ? "cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      {/* Index */}
                      <span className="text-xs text-muted font-mono w-6 shrink-0 pt-0.5 text-right">
                        {index + 1}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-sm font-medium leading-snug truncate ${
                            isActive ? "text-brand" : isLocked ? "text-muted" : "text-primary"
                          }`}>
                            {problem.title}
                          </span>
                          {problem.isPremiumProblem && (
                            <svg
                              className={`w-3.5 h-3.5 shrink-0 ${hasPremium ? "text-warning" : "text-muted"}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d={hasPremium
                                  ? "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                                  : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                }
                              />
                            </svg>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${getDifficultyStyle(problem.difficulty)}`}>
                            {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                          </span>
                          <span className="text-[11px] text-muted">
                            {problem.acceptanceRate.toFixed(1)}%
                          </span>
                          {problem.isSavedProblem && (
                            <svg className="w-3 h-3 text-brand" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Status icon */}
                      <div className="shrink-0 pt-0.5">
                        {problem.isSolvedByUser ? (
                          <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center" title="Solved">
                            <svg className="w-2.5 h-2.5 text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : problem.isAttemptedByUser ? (
                          <div className="w-4 h-4 rounded-full border-2 border-warning" title="Attempted" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-primary opacity-30" title="Not started" />
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer with progress bar */}
        <div className="px-4 py-3 border-t border-primary bg-secondary shrink-0">
          <div className="flex items-center justify-between text-xs text-muted mb-1.5">
            <span className="font-medium text-secondary">Progress</span>
            <span>{solvedCount} / {problems.length} solved</span>
          </div>
          <div className="h-1.5 bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {showPremiumModal && (
        <PremiumModal
          isOpen={showPremiumModal}
          onClose={handlePremiumModalClose}
          problemTitle={selectedPremiumProblem}
        />
      )}
    </>
  );
}
