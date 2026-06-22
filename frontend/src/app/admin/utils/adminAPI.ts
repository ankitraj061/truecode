import { axiosClient } from "@/app/utils/axiosClient";

export interface AdminProblem {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  difficulty: string;
  isActive: boolean;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProblemsResponse {
  problems: AdminProblem[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminProblemDetails extends AdminProblem {
  tags: string[];
  constraints: string[];
  companies?: string[];
  visibleTestCases: {
    input: string;
    output: string;
    explanation?: string;
    imageUrl?: string;
  }[];
  hiddenTestCases?: {
    input: string;
    output: string;
  }[];
  startCode: {
    language: string;
    initialCode: string;
  }[];
  referenceSolution?: {
    language: string;
    completeCode: string;
    timeComplexity?: string;
    spaceComplexity?: string;
  }[];
  hints?: string[];
  editorialContent?: {
    textContent?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    videoDuration?: number;
  };
}

export interface AdminUserSummary {
  _id: string;
  firstName: string;
  lastName?: string;
  emailId: string;
  username: string;
  role: "admin" | "user";
  isActive?: boolean;
  createdAt?: string;
}

export interface AdminUsersResponse {
  admins: AdminUserSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface APIError {
  error: string;
}

export interface AdminUserListItem {
  _id: string;
  firstName: string;
  lastName?: string;
  emailId: string;
  username: string;
  role: "admin" | "user";
  isActive: boolean;
  subscriptionType: "free" | "premium";
  createdAt: string;
}

export interface AdminUsersListResponse {
  users: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
}

export type FeedbackType = "bug" | "suggestion" | "question" | "other";
export type FeedbackStatus = "open" | "resolved";

export interface AdminFeedbackUser {
  _id: string;
  firstName: string;
  lastName?: string;
  emailId: string;
  username: string;
}

export interface AdminFeedbackItem {
  _id: string;
  userId: AdminFeedbackUser;
  type: FeedbackType;
  message: string;
  problemSlug?: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFeedbackResponse {
  feedback: AdminFeedbackItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ContestAvailableProblem {
  _id: string;
  title: string;
  slug: string;
  difficulty: string;
}

export interface AdminContestResponse {
  contest: {
    _id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    duration: number;
    problems: { _id: string; title: string; slug: string; difficulty: string }[];
    status: string;
    type: string;
    participantCount?: number;
  };
}

export interface AdminContestsListResponse {
  contests: Array<{
    _id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    duration: number;
    status: string;
    type: string;
    participantCount?: number;
  }>;
  total: number;
}

export class AdminAPI {
  // Problems
  static async getAdminProblems(params: {
    page?: number;
    limit?: number;
    search?: string;
    difficulty?: string;
    isActive?: boolean;
    isPremium?: boolean;
  }): Promise<AdminProblemsResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (typeof value === "boolean") {
          searchParams.append(key, value ? "true" : "false");
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    const response = await axiosClient.get(
      `/api/admin/problems?${searchParams.toString()}`
    );
    return response.data as AdminProblemsResponse;
  }

  static async createProblem(payload: {
    title: string;
    description: string;
    difficulty: string;
    tags: string[];
    constraints: string[];
    companies?: string[];
    visibleTestCases: {
      input: string;
      output: string;
      explanation?: string;
      imageUrl?: string;
    }[];
    hiddenTestCases?: {
      input: string;
      output: string;
    }[];
    startCode: {
      language: string;
      initialCode: string;
    }[];
    referenceSolution: {
      language: string;
      completeCode: string;
      timeComplexity?: string;
      spaceComplexity?: string;
    }[];
    hints?: string[];
    editorialContent?: {
      textContent?: string;
      videoUrl?: string;
      thumbnailUrl?: string;
      videoDuration?: number;
    };
    isActive?: boolean;
    isPremium?: boolean;
  }) {
    const response = await axiosClient.post("/api/problem/create", payload);
    return response.data;
  }

  static async updateProblem(
    id: string,
    payload: Partial<{
      title: string;
      description: string;
      difficulty: string;
      tags: string[];
      constraints: string[];
      companies: string[];
      visibleTestCases: { input: string; output: string; explanation?: string; imageUrl?: string }[];
      hiddenTestCases: { input: string; output: string }[];
      startCode: { language: string; initialCode: string }[];
      referenceSolution: { language: string; completeCode: string; timeComplexity?: string; spaceComplexity?: string }[];
      hints: string[];
      editorialContent: { textContent?: string; videoUrl?: string; thumbnailUrl?: string; videoDuration?: number };
      isActive: boolean;
      isPremium: boolean;
    }>
  ) {
    const response = await axiosClient.patch(`/api/problem/${id}`, payload);
    return response.data;
  }

  static async toggleProblemActive(id: string) {
    const response = await axiosClient.patch(
      `/api/admin/problems/${id}/toggle-active`
    );
    return response.data;
  }

  static async deleteProblem(id: string) {
    const response = await axiosClient.delete(`/api/problem/${id}`);
    return response.data;
  }

  static async getProblemById(id: string) {
    const response = await axiosClient.get(`/api/problem/${id}`);
    return response.data as AdminProblemDetails;
  }

  // Admins
  static async getAdmins(params: {
    page?: number;
    limit?: number;
  }): Promise<AdminUsersResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const response = await axiosClient.get(
      `/api/admin/users/admins?${searchParams.toString()}`
    );
    return response.data as AdminUsersResponse;
  }

  static async promoteToAdmin(emailId: string) {
    const response = await axiosClient.post("/api/admin/users/promote", {
      emailId,
    });
    return response.data as { message: string; user: AdminUserSummary };
  }

  static async createAdmin(payload: {
    firstName: string;
    lastName?: string;
    emailId: string;
    password: string;
  }) {
    const response = await axiosClient.post(
      "/api/admin/users/create-admin",
      payload
    );
    return response.data as { message: string; user: AdminUserSummary };
  }

  // Contests (admin): only inactive problems (isActive: false) can be added to contests
  static async getAvailableProblemsForContest(): Promise<{
    problems: ContestAvailableProblem[];
  }> {
    const response = await axiosClient.get(
      "/api/admin/contest/available-problems"
    );
    return response.data as { problems: ContestAvailableProblem[] };
  }

  static async createContest(payload: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    problemIds: string[];
    type?: "public" | "private" | "educational";
    maxParticipants?: number;
    problemScores?: { problemId: string; score: number }[];
  }) {
    const response = await axiosClient.post("/api/admin/contest", payload);
    return response.data as AdminContestResponse;
  }

  static async getAdminContests(params?: {
    page?: number;
    limit?: number;
  }): Promise<AdminContestsListResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await axiosClient.get(
      `/api/admin/contest?${searchParams.toString()}`
    );
    return response.data as AdminContestsListResponse;
  }

  static async getContestById(contestId: string) {
    const response = await axiosClient.get(`/api/admin/contest/${contestId}`);
    return response.data as AdminContestResponse;
  }

  static async updateContest(
    contestId: string,
    payload: {
      title?: string;
      description?: string;
      startTime?: string;
      endTime?: string;
      problemIds?: string[];
      type?: "public" | "private" | "educational";
      maxParticipants?: number;
      problemScores?: { problemId: string; score: number }[];
    }
  ) {
    const response = await axiosClient.patch(
      `/api/admin/contest/${contestId}`,
      payload
    );
    return response.data as AdminContestResponse;
  }

  static async deleteContest(contestId: string) {
    const response = await axiosClient.delete(
      `/api/admin/contest/${contestId}`
    );
    return response.data as { message: string };
  }

  // Manage users
  static async getAllUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: "admin" | "user";
    isActive?: boolean;
  }): Promise<AdminUsersListResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    const response = await axiosClient.get(
      `/api/admin/users?${searchParams.toString()}`
    );
    return response.data as AdminUsersListResponse;
  }

  static async toggleUserActive(id: string) {
    const response = await axiosClient.patch(
      `/api/admin/users/${id}/toggle-active`
    );
    return response.data as { message: string; user: { _id: string; isActive: boolean } };
  }

  static async updateUserRole(id: string, role: "admin" | "user") {
    const response = await axiosClient.patch(`/api/admin/users/${id}/role`, {
      role,
    });
    return response.data as { message: string; user: { _id: string; role: string } };
  }

  static async updateUserDetails(
    id: string,
    payload: { firstName?: string; lastName?: string; password?: string }
  ) {
    const response = await axiosClient.patch(`/api/admin/users/${id}`, payload);
    return response.data as { message: string; user: AdminUserSummary };
  }

  static async deleteUser(id: string) {
    const response = await axiosClient.delete(`/api/admin/users/${id}`);
    return response.data as { message: string };
  }

  // Feedback
  static async getAdminFeedback(params: {
    page?: number;
    limit?: number;
    type?: FeedbackType;
    status?: FeedbackStatus;
  }): Promise<AdminFeedbackResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const response = await axiosClient.get(
      `/api/admin/feedback?${searchParams.toString()}`
    );
    return response.data as AdminFeedbackResponse;
  }

  static async updateFeedbackStatus(id: string, status: FeedbackStatus) {
    const response = await axiosClient.patch(`/api/admin/feedback/${id}/status`, {
      status,
    });
    return response.data as { success: boolean; feedback: AdminFeedbackItem };
  }
}

