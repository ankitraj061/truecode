'use client';

import { axiosClient } from '@/app/utils/axiosClient';
import { 
  ProblemsResponse, 
  TopicsResponse, 
  CompaniesResponse, 
  SaveProblemResponse, 
  ProblemsFilters,
  APIError 
} from './types';
import { AxiosError } from 'axios';

export class ProblemsAPI {
  static async getAllProblems(filters: ProblemsFilters): Promise<ProblemsResponse> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await axiosClient.get(`/api/user/problem/all?${params.toString()}`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  static async getAllTopics(): Promise<TopicsResponse> {
    try {
      const response = await axiosClient.get('/api/user/problem/topics');
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  static async getAllCompanies(): Promise<CompaniesResponse> {
    try {
      const response = await axiosClient.get('/api/user/problem/companies');
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  static async toggleSaveProblem(problemId: string): Promise<SaveProblemResponse> {
    try {
      const response = await axiosClient.post(`/api/user/problem/save/${problemId}`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  static handleError(error: unknown): APIError {
    // Check if it's an AxiosError (common for API requests)
    if ((error as AxiosError)?.isAxiosError) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      const data = axiosError.response?.data;
      return {
        error: data?.error ?? 'API Error',
        message: data?.message ?? axiosError.message ?? 'An unknown API error occurred'
      };
    }

    // Generic JS Error
    if (error instanceof Error) {
      return {
        error: 'Network Error',
        message: error.message
      };
    }

    // Fallback
    return {
      error: 'Unknown Error',
      message: 'An unexpected error occurred'
    };
  }
}

export const problemsAPI = ProblemsAPI;
