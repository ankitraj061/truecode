'use client'

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Discussion, Reply, discussionApi, handleApiError } from './discussionApi';
import VoteButtons from './VoteButtons';
import { RootState } from '@/app/store/store';

interface ReplySectionProps {
    discussion: Discussion;
    onDiscussionUpdate: (updatedDiscussion: Discussion) => void;
    className?: string;
}

interface ReplyCardProps {
    reply: Reply;
    discussionId: string;
    onReplyUpdate: (replyId: string, updatedReply: Partial<Reply>) => void;
    onReplyDelete: (replyId: string) => void;
    isOwner: boolean;
}

// Individual Reply — rendered as a chat message bubble (own replies right-aligned)
function ReplyCard({
    reply,
    discussionId,
    onReplyUpdate,
    onReplyDelete,
    isOwner
}: ReplyCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editContent, setEditContent] = useState(reply?.content || '');
    const [error, setError] = useState<string | null>(null);

    const getUserDisplayName = () => {
        if (!reply?.userId) return 'Unknown User';
        return reply.userId.username || reply.userId._id || 'Anonymous';
    };

    const getUserInitial = () => {
        const displayName = getUserDisplayName();
        return displayName.charAt(0).toUpperCase();
    };

    const hasValidUserData = () => {
        return reply?.userId && (reply.userId.username || reply.userId._id);
    };

    const handleVoteUpdate = (upvotes: number, downvotes: number, userVote: 'upvote' | 'downvote' | null) => {
        onReplyUpdate(reply._id, {
            upvoteCount: upvotes,
            downvoteCount: downvotes,
            userVote
        });
    };

    const handleEditSubmit = async () => {
        if (!editContent.trim()) {
            setError('Reply cannot be empty');
            return;
        }

        if (editContent.trim() === reply?.content) {
            setIsEditing(false);
            return;
        }

        try {
            setError(null);
            const response = await discussionApi.editReply(discussionId, reply._id, editContent.trim());

            if (response.success) {
                onReplyUpdate(reply._id, {
                    content: editContent.trim(),
                    editedAt: new Date().toISOString()
                });
                setIsEditing(false);
            }
        } catch (error) {
            const errorMessage = handleApiError(error);
            setError(errorMessage);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this reply?')) return;

        setIsDeleting(true);
        setError(null);

        try {
            const response = await discussionApi.deleteReply(discussionId, reply._id);
            if (response.success) {
                onReplyDelete(reply._id);
            }
        } catch (error) {
            const errorMessage = handleApiError(error);
            setError(errorMessage);
            setIsDeleting(false);
        }
    };

    const handleCancelEdit = () => {
        setEditContent(reply?.content || '');
        setIsEditing(false);
        setError(null);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Unknown date';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid date';

            const now = new Date();
            const diffTime = Math.abs(now.getTime() - date.getTime());
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMinutes < 1) return 'Just now';
            if (diffMinutes < 60) return `${diffMinutes}min ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;

            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        } catch (error) {
            return 'Unknown date';
        }
    };

    if (!reply || !reply._id) {
        return (
            <div
                className="rounded-xl p-4 animate-pulse"
                style={{ backgroundColor: 'var(--error-50)', border: '1px solid var(--error-200)' }}
            >
                <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" style={{ color: 'var(--error-500)' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-medium" style={{ color: 'var(--error-700)' }}>Invalid reply data</p>
                </div>
            </div>
        );
    }

    const Avatar = () => (
        hasValidUserData() && reply.userId && reply.userId.profilePicture ? (
            <img
                src={reply.userId.profilePicture}
                alt={getUserDisplayName()}
                className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                style={{ border: '2px solid var(--border-primary)' }}
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                }}
            />
        ) : (
            <div
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}
            >
                <span className="text-xs font-medium text-inverse">{getUserInitial()}</span>
            </div>
        )
    );

    return (
        <div className={`group flex gap-2.5 ${isOwner ? 'flex-row-reverse' : 'flex-row'}`}>
            <Avatar />

            <div className={`flex flex-col max-w-[80%] ${isOwner ? 'items-end' : 'items-start'}`}>
                {/* Name + meta row */}
                <div className={`flex items-center gap-2 mb-1 ${isOwner ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {getUserDisplayName()}
                    </span>
                    <span className="text-xs text-muted">{formatDate(reply.createdAt ?? '')}</span>
                    {reply.editedAt && (
                        <span className="text-xs italic" style={{ color: 'var(--warning-600)' }}>edited</span>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div
                        className="mb-1.5 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                        style={{ backgroundColor: 'var(--error-50)', color: 'var(--error-700)' }}
                    >
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Bubble + vote row */}
                <div className={`flex items-end gap-2 ${isOwner ? 'flex-row-reverse' : 'flex-row'}`}>
                    {isEditing ? (
                        <div className="space-y-2 w-full min-w-[260px]">
                            <div className="relative">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full p-3 rounded-2xl resize-none focus:outline-none transition-all duration-200"
                                    style={{
                                        backgroundColor: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-primary)'
                                    }}
                                    rows={3}
                                    placeholder="Edit your reply..."
                                    maxLength={2000}
                                />
                                <div
                                    className="absolute bottom-2 right-2 text-xs px-2 py-0.5 rounded-full"
                                    style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)' }}
                                >
                                    {editContent.length}/2000
                                </div>
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                                <button
                                    onClick={handleEditSubmit}
                                    disabled={!editContent.trim() || editContent.trim() === reply?.content}
                                    className="px-3 py-1.5 text-white text-xs rounded-lg transition-colors font-medium disabled:opacity-50"
                                    style={{ backgroundColor: 'var(--success-600)' }}
                                >
                                    Save
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1.5 text-xs rounded-lg transition-colors font-medium"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`rounded-2xl px-4 py-2.5 ${isOwner ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                            style={{
                                backgroundColor: isOwner ? 'var(--primary-500)' : 'var(--bg-tertiary)',
                                color: isOwner ? 'var(--text-inverse)' : 'var(--text-primary)'
                            }}
                        >
                            <div className="whitespace-pre-wrap leading-relaxed text-sm">
                                {reply?.content || '[No content]'}
                            </div>
                        </div>
                    )}

                    {!isEditing && (
                        <div className="flex-shrink-0">
                            <VoteButtons
                                upvotes={reply.upvoteCount || 0}
                                downvotes={reply.downvoteCount || 0}
                                userVote={reply.userVote || null}
                                discussionId={discussionId}
                                replyId={reply._id}
                                onVoteUpdate={handleVoteUpdate}
                                size="sm"
                                orientation="vertical"
                            />
                        </div>
                    )}
                </div>

                {/* Owner actions */}
                {isOwner && !isEditing && (
                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setIsEditing(true)}
                            disabled={isDeleting}
                            className="p-1 rounded-md transition-colors disabled:opacity-50"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary-600)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                            title="Edit reply"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-1 rounded-md transition-colors disabled:opacity-50"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error-600)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                            title="Delete reply"
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
        </div>
    );
}

// Main Reply Section — a chat thread under the opened discussion
export default function ReplySection({
    discussion,
    onDiscussionUpdate,
    className = ''
}: ReplySectionProps) {
    const [newReply, setNewReply] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'popular'>('newest');

    const { user } = useSelector((state: RootState) => state.auth);
    const replies = discussion?.replies || [];

    const sortedReplies = [...replies].sort((a, b) => {
        switch (sortOrder) {
            case 'oldest':
                return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            case 'popular':
                return ((b.upvoteCount || 0) - (b.downvoteCount || 0)) - ((a.upvoteCount || 0) - (a.downvoteCount || 0));
            case 'newest':
            default:
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
    });

    const handleAddReply = async () => {
        if (!newReply.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await discussionApi.addReply(discussion._id, newReply.trim());

            if (response.success) {
                onDiscussionUpdate(response.discussion);
                setNewReply('');
            }
        } catch (error) {
            const errorMessage = handleApiError(error);
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddReply();
        }
    };

    const handleReplyUpdate = (replyId: string, updatedFields: Partial<Reply>) => {
        const updatedDiscussion: Discussion = {
            ...discussion,
            replies: discussion.replies.map(reply =>
                reply._id === replyId ? { ...reply, ...updatedFields } : reply
            )
        };
        onDiscussionUpdate(updatedDiscussion);
    };

    const handleReplyDelete = (replyId: string) => {
        const updatedDiscussion: Discussion = {
            ...discussion,
            replies: discussion.replies.filter(reply => reply._id !== replyId)
        };
        onDiscussionUpdate(updatedDiscussion);
    };

    return (
        <div
            className={`rounded-2xl overflow-hidden ${className}`}
            style={{ border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-elevated)' }}
        >
            {/* Thread Header */}
            <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border-primary)' }}
            >
                <div className="flex items-center gap-2.5">
                    <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Replies ({replies.length})
                    </h3>
                </div>

                {replies.length > 1 && (
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'popular')}
                        className="text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                        style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-primary)'
                        }}
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="popular">Most Popular</option>
                    </select>
                )}
            </div>

            {/* Chat thread */}
            <div className="px-5 py-5 space-y-4 max-h-[520px] overflow-y-auto">
                {sortedReplies.length === 0 ? (
                    <div className="text-center py-10">
                        <div
                            className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        >
                            <svg className="w-7 h-7 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h4 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No replies yet</h4>
                        <p className="text-sm text-secondary">Be the first to reply in this thread!</p>
                    </div>
                ) : (
                    sortedReplies.map((reply, index) => (
                        <div key={reply._id} className="animate-fade-in" style={{ animationDelay: `${index * 60}ms` }}>
                            <ReplyCard
                                reply={reply}
                                discussionId={discussion._id}
                                onReplyUpdate={handleReplyUpdate}
                                onReplyDelete={handleReplyDelete}
                                isOwner={user?._id === reply.userId?._id}
                            />
                        </div>
                    ))
                )}
            </div>

            {/* Chat-style composer */}
            <div
                className="px-5 py-4"
                style={{ borderTop: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}
            >
                {error && (
                    <div
                        className="mb-3 px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                        style={{ backgroundColor: 'var(--error-50)', color: 'var(--error-700)' }}
                    >
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {!user ? (
                    <div
                        className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
                        style={{ backgroundColor: 'var(--warning-50)', color: 'var(--warning-700)' }}
                    >
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span>Please log in to join the discussion</span>
                    </div>
                ) : (
                    <div className="flex items-end gap-2">
                        <div className="relative flex-1">
                            <textarea
                                value={newReply}
                                onChange={(e) => setNewReply(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a reply..."
                                className="w-full px-4 py-3 rounded-2xl resize-none focus:outline-none transition-all duration-200"
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-primary)'
                                }}
                                rows={1}
                                maxLength={2000}
                                disabled={isSubmitting}
                            />
                        </div>

                        <button
                            onClick={handleAddReply}
                            disabled={!newReply.trim() || isSubmitting}
                            className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: 'var(--primary-500)',
                                color: 'var(--text-inverse)'
                            }}
                            title="Send reply"
                        >
                            {isSubmitting ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                                </svg>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
