import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosClient } from "../utils/axiosClient";
import type { Problem, UserStatus, ProblemState } from "./types";
import { AxiosError } from "axios";

interface ApiError {
  message: string;
  statusCode: number;
  requiresSubscription?: boolean;
}

// In problemSlice.ts, update the getProblem thunk to better handle the premium error:
export const getProblem = createAsyncThunk<
  { problem: Problem; userStatus: UserStatus; slug: string },
  string,
  { rejectValue: string }
>(
  "problem/get",
  async (slug, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/api/user/problem/${slug}`);
      
      // Check if the response indicates a premium problem
      if (response.data.requiresSubscription || response.data.isPremium) {
        return rejectWithValue('Premium problem - subscription required');
      }
      
      return {
        problem: response.data.problem as Problem,
        userStatus: response.data.userStatus as UserStatus,
        slug,
      };
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      const message =
        error.response?.data?.message || "Something went wrong";
      
      // Check for premium error in the response data
      if (error.response?.data?.requiresSubscription) {
        return rejectWithValue('Premium problem - subscription required');
      }
      
      return rejectWithValue(message);
    }
  }
);

const initialState: ProblemState = {
  problem: null,
  userStatus: null,
  loading: false,
  error: null,
  fetchedSlug: null,
};

const problemSlice = createSlice({
  name: "problem",
  initialState,
  reducers: {
    clearProblem: (state) => {
      state.problem = null;
      state.userStatus = null;
      state.error = null;
      state.fetchedSlug = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getProblem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProblem.fulfilled, (state, action) => {
        state.loading = false;
        state.problem = action.payload.problem;
        state.userStatus = action.payload.userStatus;
        state.fetchedSlug = action.payload.slug;
      })
      .addCase(getProblem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch problem";
      });
  },
});

export const { clearProblem } = problemSlice.actions;
export default problemSlice.reducer;
