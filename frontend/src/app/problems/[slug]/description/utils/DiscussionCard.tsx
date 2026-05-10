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
        
        // Trigger animation
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

    // Get discussion type styling with theme variables
    const getTypeStyle = (type: string) => {
        const styles = {
            general: {
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                borderColor: 'var(--border-secondary)'
            },
            solution: {
                backgroundColor: 'var(--success-100)',
                color: 'var(--success-600)',
                borderColor: 'var(--success-500)'
            },
            hint: {
                backgroundColor: 'var(--warning-100)',
                color: 'var(--warning-600)',
                borderColor: 'var(--warning-500)'
            },
            question: {
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-700)',
                borderColor: 'var(--primary-500)'
            }
        };
        return styles[type as keyof typeof styles] || styles.general;
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
    const typeStyle = getTypeStyle(discussion.type);

    // Thumbs Up Icon Component
    const ThumbsUpIcon = ({ className }: { className: string }) => (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/>
        </svg>
    );

    // Thumbs Down Icon Component
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

    return (
        <div 
            className={`card group interactive animate-fade-in ${className}`}
            style={{
                borderRadius: 'var(--radius-2xl)',
                boxShadow: 'var(--shadow-sm)',
                border: `1px solid var(--border-primary)`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            {/* Error Message */}
            {error && (
                <div 
                    className="flex items-center space-x-2 text-sm animate-slide-up"
                    style={{
                        padding: 'var(--spacing-lg)',
                        backgroundColor: 'var(--error-100)',
                        borderBottom: `1px solid var(--error-500)`,
                        color: 'var(--error-600)',
                        borderTopLeftRadius: 'var(--radius-2xl)',
                        borderTopRightRadius: 'var(--radius-2xl)'
                    }}
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <div style={{ padding: 'var(--spacing-2xl)' }}>
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Pinned indicator */}
                        {discussion.isPinned && (
                            <div 
                                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                                style={{
                                    backgroundColor: 'var(--warning-100)',
                                    borderRadius: 'var(--radius-full)'
                                }}
                                title="Pinned discussion"
                            >
                                <svg className="w-4 h-4" style={{ color: 'var(--warning-600)' }} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                        
                        {/* Type Badge */}
                        <span 
                            className="inline-flex items-center font-semibold border"
                            style={{
                                ...typeStyle,
                                padding: `var(--spacing-sm) var(--spacing-lg)`,
                                borderRadius: 'var(--radius-full)',
                                fontSize: 'var(--font-size-xs)',
                                boxShadow: 'var(--shadow-xs)'
                            }}
                        >
                            {discussion.type.charAt(0).toUpperCase() + discussion.type.slice(1)}
                        </span>

                        {/* Title */}
                        <h3 
                            className="font-semibold cursor-pointer hover:text-brand transition-colors truncate"
                            onClick={() => onDiscussionClick(discussion)}
                            title={discussion.title}
                            style={{
                                fontSize: 'var(--font-size-lg)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            {discussion.title}
                        </h3>
                    </div>

                    {/* Actions */}
                    {isOwner && (
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => setIsEditing(true)}
                                disabled={isDeleting}
                                className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50"
                                style={{
                                    color: 'var(--text-muted)',
                                    backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'var(--primary-600)';
                                    e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--text-muted)';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                title="Edit discussion"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50"
                                style={{
                                    color: 'var(--text-muted)',
                                    backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'var(--error-600)';
                                    e.currentTarget.style.backgroundColor = 'var(--error-50)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--text-muted)';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                title="Delete discussion"
                            >
                                {isDeleting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Author & Meta Info */}
                <div 
                    className="flex items-center space-x-4 mb-4"
                    style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-secondary)'
                    }}
                >
                    <div className="flex items-center space-x-2">
                        {discussion.userId.profilePicture ? (
                            <img
                                src={discussion.userId.profilePicture}
                                alt={discussion.userId.username}
                                className="w-6 h-6 rounded-full"
                                style={{
                                    border: `2px solid var(--border-primary)`,
                                    borderRadius: 'var(--radius-full)'
                                }}
                            />
                        ) : (
                            <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                                    borderRadius: 'var(--radius-full)'
                                }}
                            >
                                <span 
                                    className="font-medium"
                                    style={{
                                        fontSize: 'var(--font-size-xs)',
                                        color: 'var(--text-inverse)'
                                    }}
                                >
                                    {discussion.userId.username.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                            {discussion.userId.username}
                        </span>
                    </div>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span>{formatDate(discussion.createdAt)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{discussion.replies?.length || 0} replies</span>
                    </span>
                </div>

                {/* Content */}
                <div className="mb-4">
                    {showFullContent ? (
                        <div 
                            className="leading-relaxed whitespace-pre-wrap"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {discussion.content}
                        </div>
                    ) : showPreview ? (
                        <div 
                            className="leading-relaxed"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {getContentPreview(discussion.content)}
                        </div>
                    ) : null}
                </div>

                {/* Tags */}
                {discussion.tags && discussion.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {discussion.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center font-medium cursor-pointer transition-all duration-200 hover:scale-105"
                                style={{
                                    padding: `var(--spacing-sm) var(--spacing-md)`,
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-secondary)',
                                    fontSize: 'var(--font-size-xs)',
                                    borderRadius: 'var(--radius-full)',
                                    border: `1px solid var(--border-primary)`
                                }}
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Actions Bar */}
                <div 
                    className="flex items-center justify-between pt-4"
                    style={{ borderTop: `1px solid var(--border-primary)` }}
                >
                    {/* Left side - Vote buttons */}
                    <div className="flex items-center space-x-1">
                        {/* Upvote */}
                        <button
                          onClick={() => handleVote('upvote')}
                          disabled={isVoting || !user}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                            discussion.userVote === 'upvote'
                              ? 'bg-success/15 text-success border border-success/30'
                              : 'text-secondary hover:text-success hover:bg-success/10 border border-transparent'
                          } ${animatingUpvote ? 'scale-110' : ''} disabled:opacity-40 disabled:cursor-not-allowed`}
                          title="Upvote"
                        >
                          <svg className="w-4 h-4" fill={discussion.userVote === 'upvote' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
                          </svg>
                          <span>{discussion.upvoteCount || 0}</span>
                        </button>

                        {/* Net Score */}
                        <div
                            className="font-semibold transition-all duration-200 mx-1"
                            style={{
                                padding: `var(--spacing-sm) var(--spacing-md)`,
                                borderRadius: 'var(--radius-full)',
                                fontSize: 'var(--font-size-sm)',
                                backgroundColor: netScore > 0 ? 'var(--success-50)' : netScore < 0 ? 'var(--error-50)' : 'var(--bg-tertiary)',
                                color: netScore > 0 ? 'var(--success-700)' : netScore < 0 ? 'var(--error-700)' : 'var(--text-secondary)',
                                border: netScore > 0 ? '1px solid var(--success-200)' : netScore < 0 ? '1px solid var(--error-200)' : '1px solid var(--border-primary)'
                            }}
                        >
                            {netScore > 0 ? `+${netScore}` : netScore}
                        </div>

                        {/* Downvote */}
                        <button
                          onClick={() => handleVote('downvote')}
                          disabled={isVoting || !user}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                            discussion.userVote === 'downvote'
                              ? 'bg-error/15 text-error border border-error/30'
                              : 'text-secondary hover:text-error hover:bg-error/10 border border-transparent'
                          } ${animatingDownvote ? 'scale-110' : ''} disabled:opacity-40 disabled:cursor-not-allowed`}
                          title="Downvote"
                        >
                          <svg className="w-4 h-4" fill={discussion.userVote === 'downvote' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" />
                          </svg>
                          <span>{discussion.downvoteCount || 0}</span>
                        </button>
                    </div>

                    {/* Right side - Discussion link */}
                    <button
                        onClick={() => onDiscussionClick(discussion)}
                        className="flex items-center space-x-2 font-medium transition-all duration-200"
                        style={{
                            padding: `var(--spacing-md) var(--spacing-xl)`,
                            color: 'var(--primary-600)',
                            backgroundColor: 'transparent',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: 'var(--font-size-sm)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--primary-50)';
                            e.currentTarget.style.color = 'var(--primary-700)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--primary-600)';
                        }}
                    >
                        <span>{showFullContent ? 'View Replies' : 'Join Discussion'}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
