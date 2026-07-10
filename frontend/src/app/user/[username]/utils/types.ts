
export interface Badge {
    name: string;
    description: string;
    earnedAt: string;
    iconUrl: string;
}

export interface ProfileData {
    firstName: string;
    lastName: string;
    username: string;
    emailId: string;
    bio: string;
    location: string;
    gender: string;
    age: number | null;
    currentStreak: number;
    longestStreak: number;
    followingCount: number;
    followersCount: number;
    badges: Badge[];
}

export interface ProblemsStats {
    easy: {
        solved: number;
        total: number;
    };
    medium: {
        solved: number;
        total: number;
    };
    hard: {
        solved: number;
        total: number;
    };
}

export interface HeatmapData {
    date: string;
    count: number;
}

export interface RecentSubmission {
    _id: string;
    problemId: {
        title: string;
        slug: string;
        difficulty: 'easy' | 'medium' | 'hard';
    };
    language: string;
    status: string;
    runtime: number;
    memory: number;
    createdAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    period?: string;
}

export interface UpdateProfileData {
    firstName?: string;
    lastName?: string;
    username?: string;
    bio?: string;
    location?: string;
    age?: number;
    gender?: string;
}

export interface UsernameCheckResponse {
    success: boolean;
    available: boolean;
    message: string;
}
