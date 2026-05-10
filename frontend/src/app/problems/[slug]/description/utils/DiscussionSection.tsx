"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Discussion,
  PaginationResponse,
  discussionApi,
  handleApiError,
  DISCUSSION_TYPES,
  DiscussionType,
} from "./discussionApi";
import DiscussionCard from "./DiscussionCard";
import DiscussionForm from "./DiscussionForm";
import ReplySection from "./ReplySection";
import { RootState } from "@/app/store/store";

interface DiscussionSectionProps {
  problemId: string;
  className?: string;
}

type ViewMode = "list" | "single" | "create";
type SortOption = "upvotes" | "createdAt" | "replies";
type FilterType = "all" | DiscussionType;

export default function DiscussionSection({
  problemId,
  className = "",
}: DiscussionSectionProps) {
  // State management
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] =
    useState<Discussion | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filtering
  const [pagination, setPagination] = useState<PaginationResponse>({
    currentPage: 1,
    totalPages: 1,
    totalDiscussions: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Filters and sorting
  const [sortBy, setSortBy] = useState<SortOption>("upvotes");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { user } = useSelector((state: RootState) => state.auth);

  // Load discussions on mount and when filters change
  useEffect(() => {
    fetchDiscussions(1);
  }, [problemId, sortBy, filterType]);

  // Fetch discussions from API
  const fetchDiscussions = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await discussionApi.getProblemDiscussions(
        problemId,
        page,
        filterType === "all" ? undefined : filterType,
        user?._id // Pass current user ID
      );

      if (response.success) {
        setDiscussions(response.discussions);
        setPagination(response.pagination);
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single discussion with replies
  const fetchSingleDiscussion = async (discussionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await discussionApi.getDiscussion(
        discussionId,
        user?._id
      );
      if (response.success) {
        setSelectedDiscussion(response.discussion);
        setViewMode("single");
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle discussion click
  const handleDiscussionClick = (discussion: Discussion) => {
    fetchSingleDiscussion(discussion._id);
  };

  // Handle discussion creation success
  const handleCreateSuccess = (newDiscussion: Discussion) => {
    setViewMode("list");
    fetchDiscussions(1); // Refresh list
  };

  // Handle discussion update
  const handleDiscussionUpdate = (updatedDiscussion: Discussion) => {
    if (viewMode === "single") {
      setSelectedDiscussion(updatedDiscussion);
    }

    // Also update in list if present
    setDiscussions((prev) =>
      prev.map((d) => (d._id === updatedDiscussion._id ? updatedDiscussion : d))
    );
  };

  // Handle discussion deletion
  const handleDiscussionDelete = (discussionId: string) => {
    if (viewMode === "single" && selectedDiscussion?._id === discussionId) {
      setViewMode("list");
      setSelectedDiscussion(null);
    }

    // Remove from list
    setDiscussions((prev) => prev.filter((d) => d._id !== discussionId));

    // Update pagination count
    setPagination((prev) => ({
      ...prev,
      totalDiscussions: prev.totalDiscussions - 1,
    }));
  };

  // Filter discussions by search query
  const filteredDiscussions = discussions.filter((discussion) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      discussion.title.toLowerCase().includes(query) ||
      discussion.content.toLowerCase().includes(query) ||
      discussion.userId.username.toLowerCase().includes(query) ||
      discussion.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // Sort filtered discussions
  const sortedDiscussions = [...filteredDiscussions].sort((a, b) => {
    // Always put pinned discussions first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    switch (sortBy) {
      case "createdAt":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "replies":
        return (b.replies?.length || 0) - (a.replies?.length || 0);
      case "upvotes":
      default:
        return (
          b.upvoteCount - b.downvoteCount - (a.upvoteCount - a.downvoteCount)
        );
    }
  });

  // Navigation functions
  const goToList = () => {
    setViewMode("list");
    setSelectedDiscussion(null);
  };

  const goToCreate = () => {
    setViewMode("create");
  };

  // Render loading state
  if (loading && discussions.length === 0) {
    return (
      <div className={`border-t border-primary pt-8 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-secondary">Loading discussions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-t border-primary pt-8 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-semibold text-primary">
              {viewMode === "single" && selectedDiscussion
                ? selectedDiscussion.title
                : "Discussion"}
            </h3>

            {viewMode === "list" && (
              <span className="bg-secondary text-secondary text-sm px-3 py-1 rounded-full">
                {pagination.totalDiscussions}{" "}
                {pagination.totalDiscussions === 1
                  ? "discussion"
                  : "discussions"}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {viewMode === "single" && (
              <button
                onClick={goToList}
                className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-secondary focus:outline-none focus:ring-0"
              >
                ← Back to Discussions
              </button>
            )}

            {viewMode === "list" && user && (
              <button
                onClick={goToCreate}
                className="px-4 py-2 bg-brand text-inverse rounded-lg hover:opacity-90 focus:outline-none focus:ring-0"
              >
                New Discussion
              </button>
            )}

            {viewMode === "create" && (
              <button
                onClick={goToList}
                className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-secondary focus:outline-none focus:ring-0"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search - Only in list view */}
        {viewMode === "list" && (
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-primary rounded-lg focus:outline-none focus:ring-0"
              />
            </div>

            {/* Filter by type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="px-3 py-2 border border-primary rounded-lg focus:outline-none focus:ring-0 bg-elevated text-primary"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-primary)",
                borderColor: "var(--border-primary)",
              }}
            >
              <option value="all">All Types</option>
              {DISCUSSION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-primary rounded-lg focus:outline-none focus:ring-0 bg-elevated text-primary"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-primary)",
                borderColor: "var(--border-primary)",
              }}
            >
              <option value="upvotes">Most Popular</option>
              <option value="createdAt">Most Recent</option>
              <option value="replies">Most Replies</option>
            </select>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg text-error">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === "create" && (
        <DiscussionForm
          problemId={problemId}
          onSuccess={handleCreateSuccess}
          onCancel={goToList}
        />
      )}

      {viewMode === "single" && selectedDiscussion && (
        <div className="space-y-6">
          <DiscussionCard
            discussion={selectedDiscussion}
            onDiscussionClick={() => {}} // No action needed in single view
            onDiscussionUpdate={handleDiscussionUpdate}
            onDiscussionDelete={handleDiscussionDelete}
            showFullContent={true}
            showPreview={false}
          />

          <ReplySection
            discussion={selectedDiscussion}
            onDiscussionUpdate={handleDiscussionUpdate}
          />
        </div>
      )}

      {viewMode === "list" && (
        <>
          {/* Discussion List */}
          {sortedDiscussions.length === 0 ? (
            <div className="text-center py-12">
              {searchQuery.trim() ? (
                <div>
                  <div className="text-4xl mb-4">🔍</div>
                  <h4 className="text-lg font-medium text-primary mb-2">
                    No discussions found
                  </h4>
                  <p className="text-secondary">
                    Try adjusting your search terms or filters.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-4">💬</div>
                  <h4 className="text-lg font-medium text-primary mb-2">
                    No discussions yet
                  </h4>
                  <p className="text-secondary mb-4">
                    Be the first to start a discussion about this problem!
                  </p>
                  {user && (
                    <button
                      onClick={goToCreate}
                      className="px-4 py-2 bg-brand text-inverse rounded-lg hover:opacity-90"
                    >
                      Start Discussion
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDiscussions.map((discussion) => (
                <DiscussionCard
                  key={discussion._id}
                  discussion={discussion}
                  onDiscussionClick={handleDiscussionClick}
                  onDiscussionUpdate={handleDiscussionUpdate}
                  onDiscussionDelete={handleDiscussionDelete}
                  showPreview={true}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-secondary">
                Showing {(pagination.currentPage - 1) * 20 + 1} to{" "}
                {Math.min(
                  pagination.currentPage * 20,
                  pagination.totalDiscussions
                )}{" "}
                of {pagination.totalDiscussions} discussions
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchDiscussions(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev || loading}
                  className="px-3 py-2 border border-primary rounded-lg text-sm disabled:bg-secondary disabled:text-muted hover:bg-secondary"
                >
                  Previous
                </button>

                <span className="px-3 py-2 text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => fetchDiscussions(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext || loading}
                  className="px-3 py-2 border border-primary rounded-lg text-sm disabled:bg-secondary disabled:text-muted hover:bg-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading indicator for additional actions */}
      {loading && discussions.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-secondary">Loading...</span>
        </div>
      )}
    </div>
  );
}
