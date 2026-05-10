import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosClient } from "../utils/axiosClient";
import type { User, AuthState, ApiError,SignupFormData } from "./types";
import type { AxiosError } from "axios";

export const registerUser = createAsyncThunk(
    "auth/register",
    async (userData: SignupFormData, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post("/api/auth/register", userData);
            return response.data.user;
        } catch (err) {
  const error = err as AxiosError<ApiError>;
  return rejectWithValue(error.response?.data?.message ?? "Something went wrong");
}

    }
);

export const loginUser = createAsyncThunk(
    "auth/login",
    async (credentials: { emailId: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post("/api/auth/login", credentials);
            return response.data.user;
        } catch (err) {
  const error = err as AxiosError<ApiError>;
  return rejectWithValue(error.response?.data?.message ?? "Something went wrong");
}

    }
)

export const checkAuth = createAsyncThunk(
    "auth/check",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get("/api/auth/check");
            return response.data.user;
       } catch (err) {
  const error = err as AxiosError<ApiError>;
  return rejectWithValue(error.response?.data?.message ?? "Something went wrong");
}

    }
)

export const logoutUser = createAsyncThunk(
    "auth/logout",
    async (_, { rejectWithValue }) => {
        try {
            await axiosClient.post("/api/auth/logout");
            return null;
        } catch (err) {
  const error = err as AxiosError<ApiError>;
  return rejectWithValue(error.response?.data?.message ?? "Something went wrong");
}

    }
)


const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  isInitialized: false,
};


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
    state.loading = false;
    state.error = (action.payload as string) ?? "Something went wrong";
    state.isAuthenticated = false;
    state.user = null;
})


    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Something went wrong";
        state.isAuthenticated = false;
        state.user = null;
      });

    // Check auth
    builder
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload ?? null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        state.error = (action.payload as string) ?? "Something went wrong";
        state.isAuthenticated = false;
        state.user = null;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Something went wrong";
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});
export default authSlice.reducer;




