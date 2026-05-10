import { axiosClient } from "@/app/utils/axiosClient";

export interface ContestListItem {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: "upcoming" | "running" | "ended";
  type: string;
  participantCount: number;
  registered: boolean;
}

export interface ContestProblem {
  _id?: string;
  title?: string;
  slug?: string;
  difficulty?: string;
  order: number;
  score?: number;
}

export interface ContestDetail {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: "upcoming" | "running" | "ended";
  type: string;
  participantCount: number;
  registered: boolean;
  problems: ContestProblem[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  penalty: number;
  totalTimeMinutes: number;
  solvedProblems: string[];
}

export const contestAPI = {
  list: async (params?: { status?: "upcoming" | "running" | "ended"; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.page != null) searchParams.set("page", String(params.page));
    if (params?.limit != null) searchParams.set("limit", String(params.limit));
    const res = await axiosClient.get(`/api/user/contest/list?${searchParams.toString()}`);
    return res.data as { contests: ContestListItem[]; total: number };
  },

  get: async (contestId: string) => {
    const res = await axiosClient.get(`/api/user/contest/${contestId}`);
    return res.data as { contest: ContestDetail };
  },

  register: async (contestId: string) => {
    const res = await axiosClient.post(`/api/user/contest/${contestId}/register`);
    return res.data as { message: string; registered: boolean };
  },

  leaderboard: async (contestId: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page != null) searchParams.set("page", String(params.page));
    if (params?.limit != null) searchParams.set("limit", String(params.limit));
    const res = await axiosClient.get(`/api/user/contest/${contestId}/leaderboard?${searchParams.toString()}`);
    return res.data as { leaderboard: LeaderboardEntry[]; total: number };
  },

  getContestProblem: async (contestId: string, problemId: string) => {
    const res = await axiosClient.get(`/api/user/contest/${contestId}/problem/${problemId}`);
    return res.data as {
      success: boolean;
      problem: Record<string, unknown>;
      contest: { _id: string; title: string; startTime: string; endTime: string; status: string };
      userStatus: { preferredLanguage: string };
      showEditorial: boolean;
    };
  },

  submitContest: async (
    contestId: string,
    problemId: string,
    body: { code: string; language: string; notes?: { timeTaken?: number; text?: string } }
  ) => {
    const res = await axiosClient.post(
      `/api/user/contest/${contestId}/submit/${problemId}`,
      body
    );
    return res.data;
  },

  my: async (params?: { status?: "upcoming" | "running" | "ended" }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    const res = await axiosClient.get(`/api/user/contest/my?${searchParams.toString()}`);
    return res.data as { contests: ContestListItem[]; total: number };
  },
};
