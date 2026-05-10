export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  emailId: string;
  role: string;
  username: string;
  subscriptionType?: 'free' | 'premium';
  profilePicture?: string;
  theme: string;
}

export interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isPremiumProblem: boolean;
  isSavedProblem: boolean;
  isSolvedByUser: boolean;
  isAttemptedByUser: boolean;
  acceptanceRate: number;
  createdAt: string;
}

export interface Topic {
  topic: string;
  count: number;
}

export interface Company {
  company: string;
  count: number;
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalProblems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProblemsResponse {
  success: boolean;
  problems: Problem[];
  pagination: PaginationInfo;
}

export interface TopicsResponse {
  success: boolean;
  topics: Topic[];
  totalTopics: number;
}

export interface CompaniesResponse {
  success: boolean;
  companies: Company[];
  totalCompanies: number;
}

export interface SaveProblemResponse {
  success: boolean;
  message: string;
  isSaved: boolean;
  problem: {
    id: string;
    title: string;
    difficulty: string;
    isPremium: boolean;
  };
}

export interface ProblemsFilters {
  page?: number;
  limit?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  status?: 'solved' | 'unsolved' | 'attempted';
  type?: 'saved' | 'premium' | 'free';
  search?: string;
  company?: string;
  topic?: string;
  sortBy?: 'title' | 'difficulty' | 'acceptance' | 'created';
  order?: 'asc' | 'desc';
}

export interface APIError {
  error: string;
  message?: string;
}

// Redux Auth State Interface
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Root State Interface
export interface RootState {
  auth: AuthState;
}
