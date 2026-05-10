// types.ts

export interface TestCase {
  input: string;
  output: string;
  explanation?: string;
  _id: string;
}

export interface StartCode {
  language: string;
  initialCode: string;
  _id: string;
}

export interface Problem {
  _id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  constraints: string[];
  visibleTestCases: TestCase[];
  startCode: StartCode[];
  hints: string[];
  companies: string[];
  tags: string[];
  isPremium: boolean;
  totalSubmissions: number;
  totalAcceptedSubmissions: number;
  totalDiscussions: number;
  totalReplies: number;
  totalDiscussionCount: number;
  createdAt: string;
}

export interface UserStatus {
  preferredLanguage: string;
  isSavedProblem: boolean;
  isSolvedByUser: boolean;
  isAttemptedByUser: boolean;
  isSubmittedByUser: boolean;
  subscriptionType: string;
}

export interface ProblemState {
  problem: Problem | null;
  userStatus: UserStatus | null;
  loading: boolean;
  error: string | null;
  fetchedSlug: string | null;
}


// types.ts
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  emailId: string;
  username: string;
  role: 'user' | 'admin';
  theme: string;
  profilePicture?: string;
  subscriptionType: 'free' | 'premium';
  subscriptionExpiry?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface SignupFormData { 
  firstName: string; 
  lastName: string; 
  emailId: string; 
  password: string; 
}
