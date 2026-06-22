"use client";

import { useSelector } from "react-redux";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams, usePathname } from "next/navigation";
import { RootState } from "@/app/store/store";
import { useState, useEffect, useRef } from "react";
import { useRunCode } from "@/app/problems/[slug]/utils/useRunCode";
import { axiosClient } from "@/app/utils/axiosClient";
import { ThemeToggle } from "@/app/components/themeToggle";
import ProblemListSidebar from "./ProblemListSidebar";
import { FiClock, FiPause, FiPlay, FiRotateCcw } from "react-icons/fi";
import type { 
  Problem, 
  TestCase, 
  SubmissionResponse,
  CodeEditorData,
  TestResultsDetail,
  WindowWithCustomProperties,
  TimerProps,
  RunCodeResult,
  ApiError
} from "./types";





export default function Navbar({ onTimerUpdate, onTimerReset }: TimerProps = {}) {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { problem } = useSelector((state: RootState) => state.problem);
  const router = useRouter();
  const pathname = usePathname();
  const { slug } = useParams();

  const redirectToLogin = () => {
    router.push(`/accounts/login?redirect=${encodeURIComponent(pathname)}`);
  };

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  // Timer states
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Combined loading state - prevents both run and submit simultaneously
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResponse | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Share / copy state
  const [copied, setCopied] = useState(false);


  // Problem navigation states
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(-1);
  const [showProblemList, setShowProblemList] = useState(false);

  // Run code hook
  const { runCode, testResults, runSummary, clearResults } = useRunCode();

  // Combined loading state - true if either running or submitting
  const isLoading = isRunning || isSubmitting;

  // Fetch problems list on mount for navigation buttons
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await axiosClient.get('/api/user/problem/all?page=1&limit=100&sortBy=title&order=asc');
        if (response.data.success) {
          setProblems(response.data.problems);
          
          // Find current problem index
          if (slug && typeof slug === 'string') {
            const index = response.data.problems.findIndex((p: Problem) => p.slug === slug);
            setCurrentProblemIndex(index);
          }
        }
      } catch (error) {
      }
    };

    if (isAuthenticated) {
      fetchProblems();
    }
  }, [isAuthenticated, slug]);

  // Navigation functions
  const navigateToProblem = (problemSlug: string) => {
    router.push(`/problems/${problemSlug}/description`);
  };

  const navigateToPrevious = () => {
    if (currentProblemIndex > 0) {
      const prevProblem = problems[currentProblemIndex - 1];
      navigateToProblem(prevProblem.slug);
    }
  };

  const navigateToNext = () => {
    if (currentProblemIndex < problems.length - 1) {
      const nextProblem = problems[currentProblemIndex + 1];
      navigateToProblem(nextProblem.slug);
    }
  };

  // Sidebar handlers
  const toggleProblemList = () => {
    setShowProblemList(!showProblemList);
  };

  const closeProblemList = () => {
    setShowProblemList(false);
  };

  const handleProblemSelect = (problemSlug: string) => {
    navigateToProblem(problemSlug);
    closeProblemList();
  };

  // Theme effects
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  // Timer effects
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          const newTime = prev + 1;
          onTimerUpdate?.(newTime);
          return newTime;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, onTimerUpdate]);

  useEffect(() => {
    if (testResults.length > 0) {
      window.testResults = testResults;
      window.runSummary = runSummary;
      
      const event = new CustomEvent('testResultsUpdated', { 
        detail: { testResults, runSummary } as TestResultsDetail
      });
      window.dispatchEvent(event);
    }
  }, [testResults, runSummary]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  const handleProfileClick = () => {
    if (user?.username) {
      router.push(`/${user.username}`);
    }
  };

  const startTimer = () => {
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    onTimerReset?.();
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const showToast = (message: string, type: 'info' | 'success' = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    showToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const getTestCasesFromTestSection = (): Array<{input: string; expectedOutput: string}> => {
    const testCasesData = window.testCasesData;
    if (!testCasesData || !Array.isArray(testCasesData)) {
      return [];
    }

    return testCasesData
      .filter((testCase: TestCase) => testCase.isCustom)
      .map((testCase: TestCase) => ({
        input: testCase.input || '',
        expectedOutput: testCase.expectedOutput || ''
      }));
  };

  const handleRunCode = async () => {
    if (!isAuthenticated) {
      showToast('Please login first to run code', 'info');
      redirectToLogin();
      return;
    }
    // Prevent running if already running or submitting
    if (isLoading) return;

    try {
      clearResults();
      setIsRunning(true);

      const codeData = window.codeEditorData;
      if (!codeData || !codeData.code || !codeData.language) {
        alert('Please write some code before running!');
        return;
      }

      const customTestCases = getTestCasesFromTestSection();

      const switchToResultsEvent = new CustomEvent('switchToResults');
      window.dispatchEvent(switchToResultsEvent);

      try {
        const result: RunCodeResult = await runCode(customTestCases);
        
        if (result.success) {
        }
      } catch (runError) {
        const error = runError as ApiError;
        
        if (error.response?.data) {
          const errorData = error.response.data;
          
          if (errorData.error === "Compilation Error" || errorData.compilationError) {
            const errorEvent = new CustomEvent('testResultsUpdated', {
              detail: {
                error: {
                  success: false,
                  error: "Compilation Error",
                  compilationError: errorData.compilationError || "Code compilation failed"
                }
              } as TestResultsDetail
            });
            window.dispatchEvent(errorEvent);
            return;
          } else {
            const errorEvent = new CustomEvent('testResultsUpdated', {
              detail: {
                error: {
                  success: false,
                  error: errorData.message || errorData.error || "Execution failed",
                  message: errorData.message || errorData.error || "An error occurred during execution"
                }
              } as TestResultsDetail
            });
            window.dispatchEvent(errorEvent);
            return;
          }
        }
        
        const errorEvent = new CustomEvent('testResultsUpdated', {
          detail: {
            error: {
              success: false,
              error: "Network Error",
              message: error.message || "Failed to connect to server. Please try again."
            }
          } as TestResultsDetail
        });
        window.dispatchEvent(errorEvent);
      }

    } catch (error) {
      const err = error as Error;
      
      const errorEvent = new CustomEvent('testResultsUpdated', {
        detail: {
          error: {
            success: false,
            error: "Unexpected Error",
            message: "An unexpected error occurred. Please try again."
          }
        } as TestResultsDetail
      });
      window.dispatchEvent(errorEvent);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!isAuthenticated) {
      showToast('Please login first to submit code', 'info');
      redirectToLogin();
      return;
    }
    // Prevent submitting if already running or submitting
    if (isLoading) return;

    if (!problem?._id) {
      alert('Problem not loaded!');
      return;
    }

    const codeData = window.codeEditorData;
    if (!codeData || !codeData.code || !codeData.language) {
      alert('Please write some code before submitting!');
      return;
    }

    stopTimer();
    setIsSubmitting(true);

    try {
      const submitPayload = {
        code: codeData.code,
        language: codeData.language,
        notes: {
          timeTaken: timerSeconds,
          text: ''
        }
      };

      const response = await axiosClient.post(`/api/submit/${problem._id}`, submitPayload);

      if (response.data.success) {
        const submissionData: SubmissionResponse = response.data;

        setSubmissionResult(submissionData);
        
        const status = submissionData.submission?.status || 'error';
        let tabName = 'Wrong Answer';
        
        if (status === 'accepted') {
          tabName = 'Accepted';
        } else if (submissionData.results?.errorMessage || 
                   submissionData.error === 'Compilation Error') {
          tabName = 'Compilation Error';
        }

        window.submissionResult = submissionData;
        window.submissionTabName = tabName;
        
        const tabEvent = new CustomEvent('createSubmissionTab', {
          detail: { 
            tabName, 
            submissionData
          }
        });
        window.dispatchEvent(tabEvent);

      }

    } catch (error) {
      const err = error as ApiError;
      
      let errorMessage = 'Submission failed. Please try again.';
      let tabName = 'Submission Error';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.error === 'Compilation Error') {
          tabName = 'Compilation Error';
          errorMessage = errorData.compilationError || 'Code compilation failed';
        } else {
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      }

      const errorResult: SubmissionResponse = {
        success: false,
        error: tabName,
        message: errorMessage,
        submission: undefined,
        results: undefined
      };

      setSubmissionResult(errorResult);
      
      window.submissionResult = errorResult;
      window.submissionTabName = tabName;
      
      const errorTabEvent = new CustomEvent('createSubmissionTab', {
        detail: { 
          tabName, 
          submissionData: errorResult
        }
      });
      window.dispatchEvent(errorTabEvent);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    window.timerFunctions = {
      reset: resetTimer,
      getTime: () => timerSeconds,
      isRunning: isTimerRunning
    };
  }, [timerSeconds, isTimerRunning]);

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-fade-in flex items-center gap-2"
          style={{
            backgroundColor: toast.type === 'success' ? 'var(--success-500)' : 'var(--primary)',
            color: 'var(--text-inverse)',
          }}
        >
          {toast.type === 'success' ? (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {toast.message}
        </div>
      )}

      <nav
        className="w-full shadow-sm border-b px-6 py-3 flex items-center justify-between"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        {/* Left: Brand + Problem List Button */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="group flex items-center space-x-2 interactive">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              <span className="font-bold text-sm" style={{ color: 'var(--text-inverse)' }}>
                TC
              </span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[var(--primary)] to-emerald-400 bg-clip-text text-transparent">
              TrueCode
            </span>
          </Link>

          {/* Problem List Toggle + Navigation */}
          {problem && (
            <div className="flex items-center space-x-2">
              {/* Problem List Toggle Button */}
              <button
                onClick={toggleProblemList}
                className="problem-list-toggle flex items-center space-x-2 px-3 py-2 rounded-md transition-colors hover:bg-secondary"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <svg 
                  className="w-4 h-4" 
                  style={{ color: 'var(--text-secondary)' }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span 
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Problem List
                </span>
              </button>

              {/* Previous/Next Navigation */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={navigateToPrevious}
                  disabled={currentProblemIndex <= 0}
                  className={`p-2 rounded-md transition-colors ${
                    currentProblemIndex <= 0 
                      ? 'cursor-not-allowed opacity-30'
                      : 'hover:bg-secondary'
                  }`}
                  style={{ 
                    color: currentProblemIndex <= 0 ? 'var(--text-muted)' : 'var(--text-secondary)'
                  }}
                  title="Previous Problem"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={navigateToNext}
                  disabled={currentProblemIndex >= problems.length - 1}
                  className={`p-2 rounded-md transition-colors ${
                    currentProblemIndex >= problems.length - 1
                      ? 'cursor-not-allowed opacity-30'
                      : 'hover:bg-secondary'
                  }`}
                  style={{ 
                    color: currentProblemIndex >= problems.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)'
                  }}
                  title="Next Problem"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center: Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunCode}
            disabled={isLoading}
            className={`btn-secondary text-sm font-medium flex items-center space-x-2 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'interactive'
            }`}
          >
            {isRunning && (
              <div
                className="animate-spin rounded-full h-4 w-4 border-b-2"
                style={{ borderColor: 'var(--text-primary)' }}
              ></div>
            )}
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>

          <button
            onClick={handleSubmitCode}
            disabled={isLoading}
            className={`text-sm font-medium flex items-center space-x-2 ${
              isLoading
                ? 'btn-secondary opacity-50 cursor-not-allowed'
                : 'btn-primary interactive'
            }`}
          >
            {isSubmitting && (
              <div
                className="animate-spin rounded-full h-4 w-4 border-b-2"
                style={{ borderColor: 'var(--text-inverse)' }}
              ></div>
            )}
            <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="btn-secondary text-sm font-medium flex items-center space-x-2 interactive"
            title="Copy problem link"
          >
            {copied ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            )}
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>

        {/* Right: Timer + Theme + Profile */}
        <div className="flex items-center space-x-4">
          {/* Timer Section */}
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-xl border shadow-xs"
            style={{ 
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <div className="flex items-center space-x-2 px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <FiClock
                className={`w-4 h-4 ${isTimerRunning ? 'animate-pulse' : ''}`}
                style={{
                  color: isTimerRunning ? 'var(--success-500)' : 'var(--text-muted)'
                }}
              />
              <span 
                className="text-sm font-mono font-semibold tracking-wide min-w-[56px]"
                style={{ 
                  color: isTimerRunning ? 'var(--success-500)' : 'var(--text-secondary)'
                }}
              >
                {formatTime(timerSeconds)}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              {!isTimerRunning ? (
                <button
                  onClick={startTimer}
                  className="p-2 rounded-lg transition-colors hover:bg-success-light"
                  style={{ color: 'var(--success-500)', backgroundColor: 'var(--bg-secondary)' }}
                  title="Start Timer"
                >
                  <FiPlay className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={stopTimer}
                  className="p-2 rounded-lg transition-colors hover:bg-error-light"
                  style={{ color: 'var(--error-500)', backgroundColor: 'var(--bg-secondary)' }}
                  title="Stop Timer"
                >
                  <FiPause className="w-3.5 h-3.5" />
                </button>
              )}
              
              {timerSeconds > 0 && (
                <button
                  onClick={resetTimer}
                  className="p-2 rounded-lg transition-colors hover:bg-secondary"
                  style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' }}
                  title="Reset Timer"
                >
                  <FiRotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <ThemeToggle />

          {/* Profile */}
          {user?.profilePicture ? (
            <div
              onClick={handleProfileClick}
              className="relative w-8 h-8 rounded-full overflow-hidden cursor-pointer interactive"
            >
              <Image
                src={user.profilePicture}
                alt="Profile"
                fill
                style={{ objectFit: "cover" }}
              />
              {user.subscriptionType === "premium" && (
                <span className="absolute -top-1 -right-1 text-yellow-400 text-xs">
                  👑
                </span>
              )}
            </div>
          ) : user?.firstName && user?.lastName ? (
            <div
              onClick={handleProfileClick}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold relative cursor-pointer interactive ${
                user.subscriptionType === "premium"
                  ? "bg-brand border-2 animate-pulse"
                  : ""
              }`}
              style={{
                backgroundColor: user.subscriptionType === "premium" ? 'var(--accent-500)' : 'var(--primary)',
                borderColor: user.subscriptionType === "premium" ? 'var(--accent-400)' : 'transparent',
                color: 'var(--text-inverse)'
              }}
            >
              {`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`}
              {user.subscriptionType === "premium" && (
                <span className="absolute -top-1 -right-1 text-yellow-400 text-xs">
                  👑
                </span>
              )}
            </div>
          ) : (
            <Link
              href={`/accounts/login?redirect=${encodeURIComponent(pathname)}`}
              className="btn-secondary text-sm"
            >
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Problem List Sidebar Component */}
      <ProblemListSidebar
        isOpen={showProblemList}
        onClose={closeProblemList}
        onProblemSelect={handleProblemSelect}
      />
    </>
  );
}
