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

// Individual Reply Card Component
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

    // Safe fallback for user data
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

    // Handle vote updates
    const handleVoteUpdate = (upvotes: number, downvotes: number, userVote: 'upvote' | 'downvote' | null) => {
        onReplyUpdate(reply._id, {
            upvoteCount: upvotes,
            downvoteCount: downvotes,
            userVote
        });
    };

    // Handle reply editing
    const handleEditSubmit = async () => {
        if (!editContent.trim()) {
            setError('Reply content cannot be empty');
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

    // Handle reply deletion
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

    // Cancel editing
    const handleCancelEdit = () => {
        setEditContent(reply?.content || '');
        setIsEditing(false);
        setError(null);
    };

    // Format date
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

    // Don't render if reply data is completely invalid
    if (!reply || !reply._id) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-pulse">
                <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-700 text-sm font-medium">Invalid reply data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="group bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
            {/* Error Message */}
            {error && (
                <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-red-700 text-sm flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <div className="flex space-x-4 p-5">
                {/* Vote Buttons */}
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

                {/* Reply Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                            {/* Author */}
                            <div className="flex items-center space-x-2">
                                {hasValidUserData() && reply.userId && reply.userId.profilePicture ? (
                                    <img
                                        src={reply.userId.profilePicture}
                                        alt={getUserDisplayName()}
                                        className="w-7 h-7 rounded-full ring-2 ring-gray-100"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-gray-100">
                                        <span className="text-xs font-medium text-white">
                                            {getUserInitial()}
                                        </span>
                                    </div>
                                )}
                                <span className="font-semibold text-gray-900">{getUserDisplayName()}</span>
                            </div>

                            {/* Date & Status */}
                            <div className="flex items-center space-x-2 text-gray-500">
                                <span>•</span>
                                <span>{formatDate(reply.createdAt ?? '')}</span>
                                {reply.editedAt && (
                                    <>
                                        <span>•</span>
                                        <span className="inline-flex items-center space-x-1 text-amber-600">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            <span className="italic">edited</span>
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        {isOwner && (
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!isEditing ? (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            disabled={isDeleting}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Edit reply"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Delete reply"
                                        >
                                            {isDeleting ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={handleEditSubmit}
                                            disabled={!editContent.trim() || editContent.trim() === reply?.content}
                                            className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 transition-colors font-medium"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    {isEditing ? (
                        <div className="space-y-3">
                            <div className="relative">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full p-4 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
                                    rows={4}
                                    placeholder="Edit your reply..."
                                    maxLength={2000}
                                />
                                <div className="absolute bottom-3 right-3 text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                                    {editContent.length}/2000
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {reply?.content || '[No content]'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Main Reply Section Component
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

    // Sort replies
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

    // Add new reply
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

    // Update reply in discussion
    const handleReplyUpdate = (replyId: string, updatedFields: Partial<Reply>) => {
        const updatedDiscussion: Discussion = {
            ...discussion,
            replies: discussion.replies.map(reply =>
                reply._id === replyId ? { ...reply, ...updatedFields } : reply
            )
        };
        onDiscussionUpdate(updatedDiscussion);
    };

    // Remove reply from discussion
    const handleReplyDelete = (replyId: string) => {
        const updatedDiscussion: Discussion = {
            ...discussion,
            replies: discussion.replies.filter(reply => reply._id !== replyId)
        };
        onDiscussionUpdate(updatedDiscussion);
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Reply Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                        Replies ({replies.length})
                    </h3>
                </div>
                
                {/* Sort Options */}
                {replies.length > 1 && (
                    <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600 font-medium">Sort by:</span>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'popular')}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="popular">Most Popular</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Add Reply Form */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="relative">
                        <textarea
                            value={newReply}
                            onChange={(e) => setNewReply(e.target.value)}
                            placeholder={user ? "Share your thoughts..." : "Please log in to reply"}
                            className="w-full p-4 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
                            rows={4}
                            maxLength={2000}
                            disabled={!user || isSubmitting}
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                            {newReply.length}/2000
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            {!user && (
                                <span className="flex items-center space-x-1 text-amber-600">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Please log in to join the discussion</span>
                                </span>
                            )}
                        </div>
                        
                        <button
                            onClick={handleAddReply}
                            disabled={!user || !newReply.trim() || isSubmitting}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    <span>Replying...</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    <span>Reply</span>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Replies List */}
            {sortedReplies.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No replies yet</h4>
                    <p className="text-gray-600">Be the first to share your thoughts on this discussion!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedReplies.map((reply, index) => (
                        <div key={reply._id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                            <ReplyCard
                                reply={reply}
                                discussionId={discussion._id}
                                onReplyUpdate={handleReplyUpdate}
                                onReplyDelete={handleReplyDelete}
                                isOwner={user?._id === reply.userId?._id}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
