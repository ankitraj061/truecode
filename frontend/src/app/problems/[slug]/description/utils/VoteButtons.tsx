'use client'

import { useState } from 'react';
import { discussionApi, handleApiError } from './discussionApi';

interface VoteButtonsProps {
    upvotes: number;
    downvotes: number;
    userVote: 'upvote' | 'downvote' | null;
    onVoteUpdate: (upvotes: number, downvotes: number, userVote: 'upvote' | 'downvote' | null) => void;
    // For discussions
    discussionId?: string;
    // For replies
    replyId?: string;
    // Optional styling
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    // Layout orientation
    orientation?: 'vertical' | 'horizontal';
}

export default function VoteButtons({
    upvotes = 0,
    downvotes = 0,
    userVote,
    onVoteUpdate,
    discussionId,
    replyId,
    size = 'md',
    className = '',
    orientation = 'vertical'
}: VoteButtonsProps) {
    const [isVoting, setIsVoting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [animatingUpvote, setAnimatingUpvote] = useState(false);
    const [animatingDownvote, setAnimatingDownvote] = useState(false);

    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return {
                    container: orientation === 'vertical' ? 'space-y-1' : 'space-x-1',
                    button: 'p-1.5 text-sm',
                    score: 'text-xs font-semibold px-2 py-1',
                    icon: 'w-3.5 h-3.5'
                };
            case 'lg':
                return {
                    container: orientation === 'vertical' ? 'space-y-2' : 'space-x-2',
                    button: 'p-3 text-lg',
                    score: 'text-base font-bold px-3 py-1.5',
                    icon: 'w-6 h-6'
                };
            default:
                return {
                    container: orientation === 'vertical' ? 'space-y-1.5' : 'space-x-1.5',
                    button: 'p-2 text-base',
                    score: 'text-sm font-semibold px-2.5 py-1',
                    icon: 'w-5 h-5'
                };
        }
    };

    const sizeClasses = getSizeClasses();
    
    // Safe number conversion and calculation
    const safeUpvotes = typeof upvotes === 'number' && !isNaN(upvotes) ? upvotes : 0;
    const safeDownvotes = typeof downvotes === 'number' && !isNaN(downvotes) ? downvotes : 0;
    const netScore = safeUpvotes - safeDownvotes;

    const handleVote = async (voteType: 'upvote' | 'downvote') => {
        if (isVoting) return;
        
        // Trigger animation
        if (voteType === 'upvote') {
            setAnimatingUpvote(true);
            setTimeout(() => setAnimatingUpvote(false), 600);
        } else {
            setAnimatingDownvote(true);
            setTimeout(() => setAnimatingDownvote(false), 600);
        }
        
        setIsVoting(true);
        setError(null);

        try {
            let response;
            
            if (replyId && discussionId) {
                // Voting on a reply
                response = await discussionApi.voteReply(discussionId, replyId, voteType);
            } else if (discussionId) {
                // Voting on a discussion
                response = await discussionApi.voteDiscussion(discussionId, voteType);
            } else {
                throw new Error('Either discussionId or both discussionId and replyId must be provided');
            }

            if (response.success) {
                onVoteUpdate(response.upvotes, response.downvotes, response.userVote);
            }
        } catch (error) {
            const errorMessage = handleApiError(error);
            setError(errorMessage);
        } finally {
            setIsVoting(false);
        }
    };

    const handleUpvote = () => handleVote('upvote');
    const handleDownvote = () => handleVote('downvote');

    // Thumbs Up Icon Component
    const ThumbsUpIcon = ({ className }: { className: string }) => (
        <svg 
            className={className}
            fill="currentColor" 
            viewBox="0 0 24 24"
        >
            <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/>
        </svg>
    );

    // Thumbs Down Icon Component
    const ThumbsDownIcon = ({ className }: { className: string }) => (
        <svg 
            className={className}
            fill="currentColor" 
            viewBox="0 0 24 24"
        >
            <path d="M15.73 12.75c.425 0 .82.236.975.632A7.48 7.48 0 0117.25 16.5c0 1.75-.599 3.358-1.602 4.634-.151.192-.373.309-.6.397-.473.183-.89.514-1.212.924a9.042 9.042 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V24a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558.107-1.282-.725-1.282H3.126c-1.026 0-1.945-.694-2.054-1.715a11.975 11.975 0 01-.068-1.285 11.95 11.95 0 012.649-7.521c.388-.482.987-.729 1.605-.729H8.77c.483 0 .964.078 1.423.23l3.114 1.04c.459.152.94.23 1.423.23h.777zM21.67 14.023a11.969 11.969 0 00.831-4.398 12 12 0 00-.52-3.507c-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977 0 1.708-.476 3.305-1.302 4.666-.245.403.028.959.5.959h1.051c.832 0 1.612-.453 1.918-1.227z"/>
        </svg>
    );

    if (orientation === 'horizontal') {
        return (
            <div className={`flex items-center ${sizeClasses.container} ${className} relative`}>
                {/* Upvote Button */}
                <button
                    onClick={handleUpvote}
                    disabled={isVoting}
                    className={`
                        ${sizeClasses.button}
                        rounded-lg transition-all duration-300 flex items-center space-x-1.5 group relative overflow-hidden
                        ${userVote === 'upvote' 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600 ring-2 ring-emerald-300' 
                            : 'text-muted hover:text-success hover:bg-success-light hover:shadow-md'
                        }
                        ${isVoting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                        focus:outline-none focus:ring-4 focus:ring-emerald-400 focus:ring-opacity-30
                    `}
                    title={userVote === 'upvote' ? 'Remove upvote' : 'Upvote'}
                    aria-label={userVote === 'upvote' ? 'Remove upvote' : 'Upvote'}
                >
                    {/* Pulse effect background */}
                    {animatingUpvote && (
                        <div className="absolute inset-0 bg-emerald-400 rounded-lg animate-ping opacity-75"></div>
                    )}
                    
                    {/* Sparkle effects */}
                    {animatingUpvote && (
                        <>
                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-bounce opacity-80"></div>
                            <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-bounce delay-75 opacity-70"></div>
                            <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-yellow-500 rounded-full animate-bounce delay-150 opacity-60"></div>
                        </>
                    )}
                    
                    <ThumbsUpIcon 
                        className={`${sizeClasses.icon} transition-all duration-300 relative z-10 ${
                            animatingUpvote ? 'animate-pulse scale-110' : userVote === 'upvote' ? 'drop-shadow-sm' : 'group-hover:scale-110'
                        }`}
                    />
                    <span className="font-medium relative z-10">{safeUpvotes}</span>
                </button>

                {/* Net Score */}
                <div className={`
                    ${sizeClasses.score} 
                    rounded-full transition-all duration-200 mx-1
                    ${netScore > 0 
                        ? 'bg-success-light text-success ring-1 ring-success'
                        : netScore < 0
                        ? 'bg-error-light text-error ring-1 ring-error'
                        : 'bg-secondary text-muted ring-1 ring-gray-200'
                    }
                `}>
                    {netScore > 0 ? `+${netScore}` : netScore.toString()}
                </div>

                {/* Downvote Button */}
                <button
                    onClick={handleDownvote}
                    disabled={isVoting}
                    className={`
                        ${sizeClasses.button}
                        rounded-lg transition-all duration-300 flex items-center space-x-1.5 group relative overflow-hidden
                        ${userVote === 'downvote' 
                            ? 'bg-red-500 text-white shadow-lg shadow-red-200 hover:bg-red-600 ring-2 ring-red-300' 
                            : 'text-muted hover:text-error hover:bg-error-light hover:shadow-md'
                        }
                        ${isVoting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                        focus:outline-none focus:ring-4 focus:ring-red-400 focus:ring-opacity-30
                    `}
                    title={userVote === 'downvote' ? 'Remove downvote' : 'Downvote'}
                    aria-label={userVote === 'downvote' ? 'Remove downvote' : 'Downvote'}
                >
                    {/* Pulse effect background */}
                    {animatingDownvote && (
                        <div className="absolute inset-0 bg-red-400 rounded-lg animate-ping opacity-75"></div>
                    )}
                    
                    {/* Shake effects */}
                    {animatingDownvote && (
                        <>
                            <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce opacity-60"></div>
                            <div className="absolute -top-1 -right-1 w-1 h-1 bg-red-300 rounded-full animate-bounce delay-75 opacity-50"></div>
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-bounce delay-100 opacity-70"></div>
                        </>
                    )}
                    
                    <ThumbsDownIcon 
                        className={`${sizeClasses.icon} transition-all duration-300 relative z-10 ${
                            animatingDownvote ? 'animate-pulse scale-110' : userVote === 'downvote' ? 'drop-shadow-sm' : 'group-hover:scale-110'
                        }`}
                    />
                    <span className="font-medium relative z-10">{safeDownvotes}</span>
                </button>

                {/* Loading Indicator */}
                {isVoting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-elevated/75 rounded-lg backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand border-t-transparent"></div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="absolute top-full left-0 mt-2 p-2 bg-red-500 text-white text-xs rounded-lg shadow-lg z-20 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Vertical layout (original)
    return (
        <div className={`flex flex-col items-center relative ${sizeClasses.container} ${className}`}>
            {/* Upvote Button */}
            <button
                onClick={handleUpvote}
                disabled={isVoting}
                className={`
                    ${sizeClasses.button}
                    rounded-xl transition-all duration-300 group relative overflow-hidden
                    ${userVote === 'upvote' 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600 ring-2 ring-emerald-300' 
                        : 'text-muted hover:text-success hover:bg-success-light hover:shadow-md hover:ring-2 hover:ring-success'
                    }
                    ${isVoting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    focus:outline-none focus:ring-4 focus:ring-emerald-400 focus:ring-opacity-30
                `}
                title={userVote === 'upvote' ? 'Remove upvote' : 'Upvote'}
                aria-label={userVote === 'upvote' ? 'Remove upvote' : 'Upvote'}
            >
                {/* Confetti effect background */}
                {animatingUpvote && (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-xl animate-ping opacity-75"></div>
                )}
                
                {/* Floating sparkles */}
                {animatingUpvote && (
                    <>
                        <div className="absolute -top-2 -left-2 w-3 h-3 bg-yellow-400 rounded-full animate-bounce opacity-80 delay-0"></div>
                        <div className="absolute -top-2 -right-2 w-2 h-2 bg-yellow-300 rounded-full animate-bounce delay-75 opacity-70"></div>
                        <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-yellow-500 rounded-full animate-bounce delay-150 opacity-60"></div>
                        <div className="absolute -bottom-2 -right-2 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-bounce delay-200 opacity-50"></div>
                        <div className="absolute top-0 right-0 w-1 h-1 bg-white rounded-full animate-ping delay-100"></div>
                    </>
                )}
                
                <ThumbsUpIcon 
                    className={`${sizeClasses.icon} transition-all duration-300 relative z-10 ${
                        animatingUpvote ? 'animate-bounce scale-125' : userVote === 'upvote' ? 'drop-shadow-sm' : 'group-hover:scale-110'
                    }`}
                />
            </button>

            {/* Score Display */}
            <div className={`
                ${sizeClasses.score} 
                rounded-full font-bold transition-all duration-300 shadow-sm min-w-[2rem] text-center
                ${netScore > 0 
                    ? 'bg-success-light text-success ring-2 ring-success'
                    : netScore < 0
                    ? 'bg-error-light text-error ring-2 ring-error'
                    : 'bg-secondary text-muted ring-2 ring-border-primary'
                }
            `}>
                {netScore > 0 ? `+${netScore}` : netScore.toString()}
            </div>

            {/* Downvote Button */}
            <button
                onClick={handleDownvote}
                disabled={isVoting}
                className={`
                    ${sizeClasses.button}
                    rounded-xl transition-all duration-300 group relative overflow-hidden
                    ${userVote === 'downvote' 
                        ? 'bg-red-500 text-white shadow-lg shadow-red-200 hover:bg-red-600 ring-2 ring-red-300' 
                        : 'text-muted hover:text-error hover:bg-error-light hover:shadow-md hover:ring-2 hover:ring-error'
                    }
                    ${isVoting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    focus:outline-none focus:ring-4 focus:ring-red-400 focus:ring-opacity-30
                `}
                title={userVote === 'downvote' ? 'Remove downvote' : 'Downvote'}
                aria-label={userVote === 'downvote' ? 'Remove downvote' : 'Downvote'}
            >
                {/* Negative energy effect */}
                {animatingDownvote && (
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-xl animate-ping opacity-75"></div>
                )}
                
                {/* Falling debris effects */}
                {animatingDownvote && (
                    <>
                        <div className="absolute -top-2 -left-2 w-2 h-2 bg-red-400 rounded-full animate-bounce opacity-60 delay-0"></div>
                        <div className="absolute -top-2 -right-2 w-1.5 h-1.5 bg-red-300 rounded-full animate-bounce delay-75 opacity-50"></div>
                        <div className="absolute -bottom-2 -left-2 w-1 h-1 bg-red-500 rounded-full animate-bounce delay-100 opacity-70"></div>
                        <div className="absolute -bottom-2 -right-2 w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce delay-150 opacity-80"></div>
                        <div className="absolute top-0 left-0 w-1 h-1 bg-red-200 rounded-full animate-ping delay-200"></div>
                    </>
                )}
                
                <ThumbsDownIcon 
                    className={`${sizeClasses.icon} transition-all duration-300 relative z-10 ${
                        animatingDownvote ? 'animate-bounce scale-125' : userVote === 'downvote' ? 'drop-shadow-sm' : 'group-hover:scale-110'
                    }`}
                />
            </button>

            {/* Loading Indicator */}
            {isVoting && (
                <div className="absolute inset-0 flex items-center justify-center bg-elevated/90 rounded-xl backdrop-blur-sm">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand border-t-transparent"></div>
                        <span className="text-xs text-brand font-medium">Voting...</span>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 bg-red-500 text-white text-xs rounded-lg shadow-xl z-20 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                    {/* Arrow pointing up */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-red-500"></div>
                </div>
            )}
        </div>
    );
}
