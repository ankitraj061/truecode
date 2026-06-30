'use client'

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Discussion, discussionApi, handleApiError } from './discussionApi';
import DiscussionForm from './DiscussionForm';
import { RootState } from '@/app/store/store';

interface DiscussionCardProps {
    discussion: Discussion;
    onDiscussionClick: (discussion: Discussion) => void;
    onDiscussionUpdate: (updatedDiscussion: Discussion) => void;
    onDiscussionDelete: (discussionId: string) => void;
    showPreview?: boolean;
    showFullContent?: boolean;
    className?: string;
}

// Small icon per discussion type — replaces the old emoji badges
function TypeIcon({ type, className }: { type: string; className: string }) {
    switch (type) {
        case 'solution':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            );
        case 'hint':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            );
        case 'question':
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        default:
            return (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            );
    }
}

export default function DiscussionCard({
    discussion,
    onDiscussionClick,
    onDiscussionUpdate,
    onDiscussionDelete,
    showPreview = true,
    showFullContent = false,
    className = ''
}: DiscussionCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isVoting, setIsVoting] = useState(false);
    const [animatingUpvote, setAnimatingUpvote] = useState(false);
    const [animatingDownvote, setAnimatingDownvote] = useState(false);

    const { user } = useSelector((state: RootState) => state.auth);
    const isOwner = user?._id === discussion.userId._id;

    // Handle vote updates with modern UI feedback
    const handleVote = async (voteType: 'upvote' | 'downvote') => {
        if (isVoting || !user) return;

        if (voteType === 'upvote') {
            setAnimatingUpvote(true);
            setTimeout(() => setAnimatingUpvote(false), 600);
        } else {
            setAnimatingDownvote(true);
            setTimeout(() => setAnimatingDownvote(false), 600);
        }

        setIsVoting(true);
        try {
            const response = await discussionApi.voteDiscussion(discussion._id, voteType);
            if (response.success) {
                const updatedDiscussion: Discussion = {
                    ...discussion,
                    upvoteCount: response.upvotes,
                    downvoteCount: response.downvotes,
                    userVote: response.userVote
                };
                onDiscussionUpdate(updatedDiscussion);
            }
        } catch (error) {
            const errorMessage = handleApiError(error);
            setError(errorMessage);
        } finally {
            setIsVoting(false);
        }
    };

    // Handle discussion deletion
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this discussion? This action cannot be undone.')) {
            return;
        }

        setIsDeleting(true);
        setError(null);

        try {
            const response = await discussionApi.deleteDiscussion(discussion._id);
            if (response.success) {
                onDiscussionDelete(discussion._id);
            }
        } catch (error) {
            const errorMessage = handleApiError(error);
            setError(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle edit success
    const handleEditSuccess = (updatedDiscussion: Discussion) => {
        setIsEditing(false);
        onDiscussionUpdate(updatedDiscussion);
    };

    // Get discussion type color (used for the small type icon, not a big badge anymore)
    const getTypeColor = (type: string) => {
        const colors = {
            general: 'var(--text-secondary)',
            solution: 'var(--success-600)',
            hint: 'var(--warning-600)',
            question: 'var(--primary-600)'
        };
        return colors[type as keyof typeof colors] || colors.general;
    };

    // Format date with modern styling
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}min ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    // Get content preview
    const getContentPreview = (content: string, maxLength = 280) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength).trim() + '...';
    };

    const netScore = (discussion.upvoteCount || 0) - (discussion.downvoteCount || 0);
    const typeColor = getTypeColor(discussion.type);

    const ThumbsUpIcon = ({ className }: { className: string }) => (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/>
        </svg>
    );

    const ThumbsDownIcon = ({ className }: { className: string }) => (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.73 12.75c.425 0 .82.236.975.632A7.48 7.48 0 0117.25 16.5c0 1.75-.599 3.358-1.602 4.634-.151.192-.373.309-.6.397-.473.183-.89.514-1.212.924a9.042 9.042 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V24a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558.107-1.282-.725-1.282H3.126c-1.026 0-1.945-.694-2.054-1.715a11.975 11.975 0 01-.068-1.285 11.95 11.95 0 012.649-7.521c.388-.482.987-.729 1.605-.729H8.77c.483 0 .964.078 1.423.23l3.114 1.04c.459.152.94.23 1.423.23h.777zM21.67 14.023a11.969 11.969 0 00.831-4.398 12 12 0 00-.52-3.507c-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977 0 1.708-.476 3.305-1.302 4.666-.245.403.028.959.5.959h1.051c.832 0 1.612-.453 1.918-1.227z"/>
        </svg>
    );

    if (isEditing) {
        return (
            <div className={className}>
                <DiscussionForm
                    problemId={discussion.problemId as string}
                    existingDiscussion={{
                        _id: discussion._id,
                        title: discussion.title,
                        content: discussion.content,
                        type: discussion.type,
                        tags: discussion.tags
                    }}
                    onSuccess={handleEditSuccess}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        );
    }

    // The "full content" view (single discussion opened) gets a contained chat-header
    // bubble; the list preview is a flat chat-message row (no card border) so a stack
    // of them reads like a conversation rather than a stack of forms.
    const Avatar = ({ size = 'w-10 h-10' }: { size?: string }) => (
        discussion.userId.profilePicture ? (
            <img
                src={discussion.userId.profilePicture}
                alt={discussion.userId.username}
                className={`${size} rounded-full flex-shrink-0 object-cover`}
                style={{ border: '2px solid var(--border-primary)' }}
            />
        ) : (
            <div
                className={`${size} rounded-full flex-shrink-0 flex items-center justify-center`}
                style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}
            >
                <span className="font-medium text-inverse" style={{ fontSize: 'var(--font-size-sm)' }}>
                    {discussion.userId.username.charAt(0).toUpperCase()}
                </span>
            </div>
        )
    );

    return (
        <div
            className={`group animate-fade-in ${showFullContent ? 'card' : 'hover:bg-secondary transition-colors'} ${className}`}
            style={showFullContent ? {
                borderRadius: 'var(--radius-2xl)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border-primary)'
            } : { padding: 'var(--spacing-xl)' }}
        >
            {/* Error Message */}
            {error && (
                <div
                    className="flex items-center space-x-2 text-sm animate-slide-up mb-3"
                    style={{
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'var(--error-100)',
                        color: 'var(--error-600)',
                        borderRadius: 'var(--radius-lg)'
                    }}
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <div style={showFullContent ? { padding: 'var(--spacing-2xl)' } : undefined}>
                <div className="flex items-start gap-3">
                    <Avatar size={showFullContent ? 'w-12 h-12' : 'w-10 h-10'} />

                    <div className="flex-1 min-w-0">
                        {/* Name + meta row */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                    {discussion.userId.username}
                                </span>

                                {discussion.isPinned && (
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--warning-600)' }} fill="currentColor" viewBox="0 0 20 20">
                                        <title>Pinned discussion</title>
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                )}

                                <TypeIcon type={discussion.type} className="w-3.5 h-3.5 flex-shrink-0" />
                                <span style={{ color: typeColor, fontSize: 'var(--font-size-xs)' }} className="capitalize">
                                    {discussion.type}
                                </span>

                                <span className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                                    {formatDate(discussion.createdAt)}
                                </span>
                            </div>

                            {/* Owner actions */}
                            {isOwner && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        disabled={isDeleting}
                                        className="p-1.5 rounded-lg transition-all duration-200 disabled:opacity-50"
                                        style={{ color: 'var(--text-muted)' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary-600)'; e.currentTarget.style.backgroundColor = 'var(--primary-50)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                        title="Edit discussion"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="p-1.5 rounded-lg transition-all duration-200 disabled:opacity-50"
                                        style={{ color: 'var(--text-muted)' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error-600)'; e.currentTarget.style.backgroundColor = 'var(--error-50)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                        title="Delete discussion"
                                    >
                                        {isDeleting ? (
                                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent"></div>
                                        ) : (
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Message bubble */}
                        <div
                            className="mt-1.5 inline-block max-w-full rounded-2xl rounded-tl-sm px-4 py-2.5 cursor-pointer"
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            onClick={() => !showFullContent && onDiscussionClick(discussion)}
                        >
                            <div
                                className={showFullContent ? 'leading-relaxed whitespace-pre-wrap' : 'leading-relaxed'}
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {showFullContent ? discussion.content : getContentPreview(discussion.content)}
                            </div>
                        </div>

                        {/* Tags */}
                        {discussion.tags && discussion.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {discussion.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center font-medium"
                                        style={{
                                            padding: '2px 10px',
                                            backgroundColor: 'var(--bg-tertiary)',
                                            color: 'var(--text-secondary)',
                                            fontSize: 'var(--font-size-xs)',
                                            borderRadius: 'var(--radius-full)',
                                            border: '1px solid var(--border-primary)'
                                        }}
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Footer actions */}
                        <div className="flex items-center gap-3 mt-2">
                            <button
                                onClick={() => handleVote('upvote')}
                                disabled={isVoting || !user}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                                    discussion.userVote === 'upvote'
                                        ? 'bg-success/15 text-success'
                                        : 'text-secondary hover:text-success hover:bg-success/10'
                                } ${animatingUpvote ? 'scale-110' : ''} disabled:opacity-40 disabled:cursor-not-allowed`}
                                title="Upvote"
                            >
                                <ThumbsUpIcon className="w-3.5 h-3.5" />
                                <span>{discussion.upvoteCount || 0}</span>
                            </button>

                            <button
                                onClick={() => handleVote('downvote')}
                                disabled={isVoting || !user}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                                    discussion.userVote === 'downvote'
                                        ? 'bg-error/15 text-error'
                                        : 'text-secondary hover:text-error hover:bg-error/10'
                                } ${animatingDownvote ? 'scale-110' : ''} disabled:opacity-40 disabled:cursor-not-allowed`}
                                title="Downvote"
                            >
                                <ThumbsDownIcon className="w-3.5 h-3.5" />
                                <span>{discussion.downvoteCount || 0}</span>
                            </button>

                            {netScore !== 0 && (
                                <span
                                    className="text-xs font-semibold"
                                    style={{ color: netScore > 0 ? 'var(--success-600)' : 'var(--error-600)' }}
                                >
                                    {netScore > 0 ? `+${netScore}` : netScore}
                                </span>
                            )}

                            {!showFullContent && (
                                <button
                                    onClick={() => onDiscussionClick(discussion)}
                                    className="flex items-center gap-1 ml-auto text-xs font-medium transition-colors"
                                    style={{ color: 'var(--primary-600)' }}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span>{discussion.replies?.length || 0} {discussion.replies?.length === 1 ? 'reply' : 'replies'}</span>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
