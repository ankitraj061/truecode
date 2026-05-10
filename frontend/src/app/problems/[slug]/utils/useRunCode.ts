import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import { axiosClient } from '@/app/utils/axiosClient';
import type { AxiosError } from 'axios';

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  status: string;
  executionTime: number;
  errorMessage?: string;
}

interface RunSummary {
  allPassed: boolean;
  passedTests: number;
  totalTests: number;
  executionTime: number;
  memoryUsage: number;
}

// Define the error response structure from your API
interface APIErrorResponse {
  success: false;
  error: string;
  message?: string;
  compilationError?: string;
}

// Define the structured error type
interface StructuredError {
  response: {
    data: APIErrorResponse;
  };
  message: string;
}

export const useRunCode = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  
  const { problem } = useSelector((state: RootState) => state.problem);

  const runCode = async (customTestCases: Array<{ input: string; expectedOutput: string }> = []) => {
    if (!problem?._id) {
      throw new Error('No problem available');
    }

    // Get code data from global window object
    const codeData = window.codeEditorData;
    if (!codeData || !codeData.code || !codeData.language) {
      throw new Error('No code available to run');
    }

    setIsRunning(true);
    setTestResults([]);
    setRunSummary(null);

    try {
      const requestBody = {
        code: codeData.code,
        language: codeData.language,
        customTestCases
      };

      const response = await axiosClient.post(`/api/run/${problem._id}`, requestBody);

      if (response.data.success) {
        setTestResults(response.data.testResults);
        setRunSummary(response.data.summary);
        return {
          success: true,
          results: response.data.testResults,
          summary: response.data.summary
        };
      } else {
        throw new Error(response.data.message || 'Failed to run code');
      }
    } catch (error: unknown) {
      
      // Clear any existing results
      setTestResults([]);
      setRunSummary(null);

      // Type guard to check if it's an AxiosError
      const isAxiosError = (err: unknown): err is AxiosError<APIErrorResponse> => {
        return (err as AxiosError)?.response?.data !== undefined;
      };

      // Don't create fake test results - just throw the error with proper structure
      if (isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data;
        
        // Create a structured error object
        const structuredError: StructuredError = {
          response: {
            data: {
              success: false,
              error: errorData.error || 'Execution failed',
              message: errorData.message || errorData.error,
              compilationError: errorData.compilationError
            }
          },
          message: errorData.message || errorData.error || 'Failed to run code'
        };
        
        throw structuredError;
      }
      
      // For network errors or other issues
      const networkError: StructuredError = {
        response: {
          data: {
            success: false,
            error: 'Network Error',
            message: error instanceof Error ? error.message : 'Failed to connect to server'
          }
        },
        message: error instanceof Error ? error.message : 'Network error occurred'
      };
      
      throw networkError;
    } finally {
      setIsRunning(false);
    }
  };

  return {
    runCode,
    isRunning,
    testResults,
    runSummary,
    clearResults: () => {
      setTestResults([]);
      setRunSummary(null);
    }
  };
};
