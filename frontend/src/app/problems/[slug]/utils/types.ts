export interface SubmissionNotes {
  timeTaken: number;
  text: string;
}

export interface SubmissionInfo {
  id: string;
  status: string;
  testCasesPassed: number;
  totalTestCases: number;
  executionTime: number;
  memoryUsage: number;
  language: string;
  submittedAt: string; // ISO string
  notes: SubmissionNotes;
}

export interface TestCaseDetail {
  index: number;
  passed: boolean;
  statusId: number;
  status: string;
  executionTime: number;
  memoryUsage: number;
  isVisible: boolean;
  isHidden: boolean;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  errorMessage?: string;
}

export interface OverallResult {
  status: string;
  passed: boolean;
  passedTests: number;
  totalTests: number;
  visibleTests: number;
  hiddenTests: number;
  executionTime: number;
  memoryUsage: number;
}

export interface SubmissionResults {
  overall: OverallResult;
  testDetails: TestCaseDetail[];
  errorMessage?: string;
}

export interface ProblemInfo {
  id: string;
  title: string;
  difficulty: string;
}

export interface SubmissionResponse {
  success: boolean;
  message: string;
  submission?: SubmissionInfo;
  results?: SubmissionResults;
  problem?: ProblemInfo;
  error?: string;
}


export interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isCustom?: boolean;
}

export interface CodeEditorData {
  code: string;
  language: string;
}

export interface TestResultsDetail {
  testResults?: unknown[];
  runSummary?: {
    passedTests: number;
    totalTests: number;
  };
  error?: {
    success: boolean;
    error: string;
    message?: string;
    compilationError?: string;
  };
}

export interface WindowWithCustomProperties extends Window {
  testCasesData?: TestCase[];
  codeEditorData?: CodeEditorData;
  testResults?: unknown[];
  runSummary?: {
    passedTests: number;
    totalTests: number;
  } | null;
  submissionResult?: SubmissionResponse;
  submissionTabName?: string;
  timerFunctions?: {
    reset: () => void;
    getTime: () => number;
    isRunning: boolean;
  };
}

export interface TimerProps {
  onTimerUpdate?: (time: number) => void;
  onTimerReset?: () => void;
}

export interface RunCodeResult {
  success: boolean;
  summary: {
    passedTests: number;
    totalTests: number;
  };
}

export interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
      compilationError?: string;
    };
  };
  message?: string;
}



export interface StartCodeEntry {
  language: string;
  initialCode: string;
}

export interface DraftResponse {
  success: boolean;
  draft?: {
    code: string;
    language: string;
    updatedAt: string;
    codeLength: number;
  };
  saved?: boolean;
  reason?: string;
}

export interface LastSubmissionResponse {
  success: boolean;
  hasSubmission: boolean;
  submission?: {
    code: string;
    language: string;
    status: string;
    testCasesPassed: number;
    testCasesTotal: number;
  };
}

export interface FormatResponse {
  success: boolean;
  formattedCode: string;
}



