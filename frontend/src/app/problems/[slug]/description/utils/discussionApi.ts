import { axiosClient } from '@/app/utils/axiosClient';
import type { AxiosError } from 'axios';

export interface Discussion {
    _id: string;
    title: string;
    content: string;
    type: string;
    upvoteCount: number;
    downvoteCount: number;
    userVote: 'upvote' | 'downvote' | null;
    userId: {
        _id: string;
        username: string;
        profilePicture?: string;
    };
    createdAt: string;
    replies: Reply[];
    isPinned?: boolean;
    tags?: string[];
    problemId?: string;
    // Raw API fields (for internal use)
    upvotes?: string[];
    downvotes?: string[];
}

export interface Reply {
    _id: string;
    content?: string;
    upvoteCount: number;
    downvoteCount: number;
    userVote: 'upvote' | 'downvote' | null;
    userId?: {
        _id: string;
        username?: string;
        profilePicture?: string;
    };
    createdAt?: string;
    editedAt?: string;
    // Raw API fields (for internal use)
    upvotes?: string[];
    downvotes?: string[];
}

export interface CreateDiscussionData {
    problemId: string;
    title: string;
    content: string;
    type: string;
    tags?: string[];
}

export interface UpdateDiscussionData {
    title?: string;
    content?: string;
    type?: string;
    tags?: string[];
}

export interface PaginationResponse {
    currentPage: number;
    totalPages: number;
    totalDiscussions: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface DiscussionsResponse {
    success: boolean;
    discussions: Discussion[];
    pagination: PaginationResponse;
}

export interface DiscussionResponse {
    success: boolean;
    discussion: Discussion;
}

export interface VoteResponse {
    success: boolean;
    message: string;
    upvotes: number;
    downvotes: number;
    userVote: 'upvote' | 'downvote' | null;
}

// Define raw API response interfaces
interface RawDiscussionData {
    _id: string;
    title: string;
    content: string;
    type: string;
    userId: {
        _id: string;
        username: string;
        profilePicture?: string;
    };
    createdAt: string;
    replies?: RawReplyData[];
    isPinned?: boolean;
    tags?: string[];
    problemId?: string;
    upvotes?: string[];
    downvotes?: string[];
}

interface RawReplyData {
    _id: string;
    content?: string;
    userId?: {
        _id: string;
        username?: string;
        profilePicture?: string;
    };
    createdAt?: string;
    editedAt?: string;
    upvotes?: string[];
    downvotes?: string[];
}

// Helper functions to transform API data
const transformDiscussionData = (discussion: RawDiscussionData, currentUserId?: string): Discussion => {
    const upvotes = discussion.upvotes || [];
    const downvotes = discussion.downvotes || [];
    
    let userVote: 'upvote' | 'downvote' | null = null;
    if (currentUserId) {
        if (upvotes.includes(currentUserId)) userVote = 'upvote';
        else if (downvotes.includes(currentUserId)) userVote = 'downvote';
    }
    
    return {
        ...discussion,
        upvoteCount: upvotes.length,
        downvoteCount: downvotes.length,
        userVote,
        replies: (discussion.replies || []).map((reply: RawReplyData) => transformReplyData(reply, currentUserId))
    };
};

const transformReplyData = (reply: RawReplyData, currentUserId?: string): Reply => {
    const upvotes = reply.upvotes || [];
    const downvotes = reply.downvotes || [];
    
    let userVote: 'upvote' | 'downvote' | null = null;
    if (currentUserId) {
        if (upvotes.includes(currentUserId)) userVote = 'upvote';
        else if (downvotes.includes(currentUserId)) userVote = 'downvote';
    }
    
    return {
        ...reply,
        upvoteCount: upvotes.length,
        downvoteCount: downvotes.length,
        userVote
    };
};

// Define API error response interface
interface APIErrorResponse {
    error?: string;
    message?: string;
}

class DiscussionApiService {
    // Get all discussions for a problem
    async getProblemDiscussions(
        problemId: string, 
        page = 1, 
        type?: string, 
        currentUserId?: string
    ): Promise<DiscussionsResponse> {
        const params = new URLSearchParams({ page: page.toString() });
        if (type) params.append('type', type);
        
        const response = await axiosClient.get(`/api/user/discussion/problem/${problemId}?${params}`);
        const data = response.data as DiscussionsResponse & { discussions: RawDiscussionData[] };
        
        if (data.success) {
            data.discussions = data.discussions.map((discussion: RawDiscussionData) => 
                transformDiscussionData(discussion, currentUserId)
            );
        }
        
        return data;
    }

    // Get single discussion with replies
    async getDiscussion(discussionId: string, currentUserId?: string): Promise<DiscussionResponse> {
        const response = await axiosClient.get(`/api/user/discussion/${discussionId}`);
        const data = response.data as DiscussionResponse & { discussion: RawDiscussionData };
        
        if (data.success) {
            data.discussion = transformDiscussionData(data.discussion, currentUserId);
        }
        
        return data;
    }

    // Create new discussion
    async createDiscussion(data: CreateDiscussionData, currentUserId?: string): Promise<DiscussionResponse> {
        const response = await axiosClient.post('/api/user/discussion/', data);
        const responseData = response.data as DiscussionResponse & { discussion: RawDiscussionData };
        
        if (responseData.success) {
            responseData.discussion = transformDiscussionData(responseData.discussion, currentUserId);
        }
        
        return responseData;
    }

    // Update discussion
    async updateDiscussion(
        discussionId: string, 
        data: UpdateDiscussionData, 
        currentUserId?: string
    ): Promise<DiscussionResponse> {
        const response = await axiosClient.put(`/api/user/discussion/${discussionId}`, data);
        const responseData = response.data as DiscussionResponse & { discussion: RawDiscussionData };
        
        if (responseData.success) {
            responseData.discussion = transformDiscussionData(responseData.discussion, currentUserId);
        }
        
        return responseData;
    }

    // Delete discussion
    async deleteDiscussion(discussionId: string): Promise<{ success: boolean; message: string }> {
        const response = await axiosClient.delete(`/api/user/discussion/${discussionId}`);
        return response.data as { success: boolean; message: string };
    }

    // Add reply to discussion
    async addReply(
        discussionId: string, 
        content: string, 
        currentUserId?: string
    ): Promise<DiscussionResponse> {
        const response = await axiosClient.post(`/api/user/discussion/${discussionId}/replies`, { content });
        const responseData = response.data as DiscussionResponse & { discussion: RawDiscussionData };
        
        if (responseData.success) {
            responseData.discussion = transformDiscussionData(responseData.discussion, currentUserId);
        }
        
        return responseData;
    }

    // Edit reply
    async editReply(
        discussionId: string, 
        replyId: string, 
        content: string, 
        currentUserId?: string
    ): Promise<{ success: boolean; message: string; reply?: Reply }> {
        const response = await axiosClient.put(`/api/user/discussion/${discussionId}/replies/${replyId}`, { content });
        const responseData = response.data as { success: boolean; message: string; reply: RawReplyData };
        
        if (responseData.success) {
            const transformedReply = transformReplyData(responseData.reply, currentUserId);
            return {
                success: responseData.success,
                message: responseData.message,
                reply: transformedReply
            };
        }
        
        return {
            success: responseData.success,
            message: responseData.message
        };
    }

    // Delete reply
    async deleteReply(discussionId: string, replyId: string): Promise<{ success: boolean; message: string; totalReplies: number }> {
        const response = await axiosClient.delete(`/api/user/discussion/${discussionId}/replies/${replyId}`);
        return response.data as { success: boolean; message: string; totalReplies: number };
    }

    // Vote on discussion
    async voteDiscussion(discussionId: string, voteType: 'upvote' | 'downvote'): Promise<VoteResponse> {
        const response = await axiosClient.post(`/api/user/discussion/${discussionId}/vote`, { voteType });
        return response.data as VoteResponse;
    }

    // Vote on reply
    async voteReply(discussionId: string, replyId: string, voteType: 'upvote' | 'downvote'): Promise<VoteResponse> {
        const response = await axiosClient.post(`/api/user/discussion/${discussionId}/replies/${replyId}/vote`, { voteType });
        return response.data as VoteResponse;
    }

    // Get user's own discussions
    async getMyDiscussions(
        page = 1, 
        type?: string, 
        currentUserId?: string
    ): Promise<DiscussionsResponse> {
        const params = new URLSearchParams({ page: page.toString() });
        if (type) params.append('type', type);
        
        const response = await axiosClient.get(`/api/user/discussion/my?${params}`);
        const data = response.data as DiscussionsResponse & { discussions: RawDiscussionData[] };
        
        if (data.success) {
            data.discussions = data.discussions.map((discussion: RawDiscussionData) => 
                transformDiscussionData(discussion, currentUserId)
            );
        }
        
        return data;
    }
}

// Export singleton instance
export const discussionApi = new DiscussionApiService();

// Export error handler utility
export const handleApiError = (error: unknown): string => {
    // Type guard for AxiosError
    const isAxiosError = (err: unknown): err is AxiosError<APIErrorResponse> => {
        return (err as AxiosError)?.response?.data !== undefined;
    };

    if (isAxiosError(error) && error.response?.data?.error) {
        return error.response.data.error;
    }
    
    if (error instanceof Error && error.message) {
        return error.message;
    }
    
    return 'An unexpected error occurred';
};

// Export discussion types for forms
export const DISCUSSION_TYPES = [
    { value: 'general', label: 'General' },
    { value: 'solution', label: 'Solution' },
    { value: 'hint', label: 'Hint' },
    { value: 'question', label: 'Question' }
] as const;

export type DiscussionType = typeof DISCUSSION_TYPES[number]['value'];

// Export transformation functions for external use if needed
export { transformDiscussionData, transformReplyData };
