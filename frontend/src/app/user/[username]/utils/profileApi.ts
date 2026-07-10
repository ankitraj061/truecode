// services/profileApi.ts
import { axiosClient } from '@/app/utils/axiosClient';
import type {
    ProfileData,
    ProblemsStats,
    HeatmapData,
    RecentSubmission,
    ApiResponse,
    UpdateProfileData,
    UsernameCheckResponse
} from './types';

export class ProfileAPI {
    private static readonly BASE_URL = '/api/profile';

    // GET profile data
    static async getProfile(): Promise<ProfileData> {
        const response = await axiosClient.get<ApiResponse<ProfileData>>(
            this.BASE_URL
        );
        return response.data.data;
    }

    // UPDATE profile
    static async updateProfile(data: UpdateProfileData): Promise<ProfileData> {
        const response = await axiosClient.patch<ApiResponse<ProfileData>>(
            this.BASE_URL,
            data
        );
        return response.data.data;
    }

    // CHECK username availability
    static async checkUsername(username: string): Promise<UsernameCheckResponse> {
        const response = await axiosClient.get<UsernameCheckResponse>(
            `${this.BASE_URL}/username-check`,
            { params: { username } }
        );
        return response.data;
    }

    // GET problems statistics
    static async getProblemsStats(): Promise<ProblemsStats> {
        const response = await axiosClient.get<ApiResponse<ProblemsStats>>(
            `${this.BASE_URL}/problems-stats`
        );
        return response.data.data;
    }

    // GET heatmap data
    static async getHeatmapData(year?: number): Promise<HeatmapData[]> {
        const response = await axiosClient.get<ApiResponse<HeatmapData[]>>(
            `${this.BASE_URL}/heatmap`,
            { params: year ? { year } : {} }
        );
        return response.data.data;
    }

    // GET recent submissions
    static async getRecentSubmissions(): Promise<RecentSubmission[]> {
        const response = await axiosClient.get<ApiResponse<RecentSubmission[]>>(
            `${this.BASE_URL}/recent-submissions`
        );
        return response.data.data;
    }
}
