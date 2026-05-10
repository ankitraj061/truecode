'use client'

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isCustom: boolean;
  explanation?: string;
}

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

interface TestResultsEventDetail {
  testResults?: TestResult[];
  runSummary?: RunSummary;
  error?: {
    compilationError?: string;
    error?: string;
    message?: string;
  };
}

export default function TestCasesSection() {
  const [activeTab, setActiveTab] = useState('testcase');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [editingCase, setEditingCase] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [compilationError, setCompilationError] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const { problem } = useSelector((state: RootState) => state.problem);

  // Initialize test cases from problem data
  useEffect(() => {
    if (problem?.visibleTestCases) {
      const initialCases: TestCase[] = problem.visibleTestCases.map((testCase: unknown, index: number) => {
        const tc = testCase as { input?: string; output?: string; explanation?: string };
        return {
          id: `default-${index}`,
          input: tc.input || '',
          expectedOutput: tc.output || '',
          explanation: tc.explanation || '',
          isCustom: false
        };
      });
      setTestCases(initialCases);
      setActiveTestCase(0);
    }
  }, [problem]);

  // Expose test cases data globally for Navbar component
  useEffect(() => {
    window.testCasesData = testCases;
  }, [testCases]);

  // Listen for events from Navbar component
  useEffect(() => {
    const handleResultsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<TestResultsEventDetail>;
      const { testResults: newResults, runSummary: newSummary, error } = customEvent.detail || {};
      
      // Clear previous errors
      setCompilationError(null);
      setExecutionError(null);
      
      if (error) {
        // Handle different types of errors
        if (error.compilationError) {
          setCompilationError(error.compilationError);
          setTestResults([]);
          setRunSummary(null);
        } else if (error.error === "Compilation Error") {
          setCompilationError(error.compilationError || "Code compilation failed");
          setTestResults([]);
          setRunSummary(null);
        } else {
          setExecutionError(error.message || error.error || "An error occurred during execution");
          setTestResults([]);
          setRunSummary(null);
        }
      } else {
        setTestResults(newResults || []);
        setRunSummary(newSummary || null);
      }
      
      setIsLoadingResults(false);
    };

    const handleSwitchToResults = () => {
      setActiveTab('result');
      setIsLoadingResults(true);
      // Clear previous results and errors when starting new run
      setTestResults([]);
      setRunSummary(null);
      setCompilationError(null);
      setExecutionError(null);
    };

    const handleRunStarted = () => {
      setIsLoadingResults(true);
      setTestResults([]);
      setRunSummary(null);
      setCompilationError(null);
      setExecutionError(null);
    };

    window.addEventListener('testResultsUpdated', handleResultsUpdate as EventListener);
    window.addEventListener('switchToResults', handleSwitchToResults);
    window.addEventListener('runStarted', handleRunStarted);

    return () => {
      window.removeEventListener('testResultsUpdated', handleResultsUpdate as EventListener);
      window.removeEventListener('switchToResults', handleSwitchToResults);
      window.removeEventListener('runStarted', handleRunStarted);
    };
  }, []);

  const tabs = [
    { id: 'testcase', name: 'Testcase' },
    { 
      id: 'result', 
      name: 'Test Result',
      badge: compilationError || executionError ? '!' : (testResults.length > 0 ? testResults.filter(r => !r.passed).length : null)
    },
  ];

  // Add new custom test case
  const addTestCase = () => {
    const firstCase = testCases[0];
    if (!firstCase) return;

    const newCase: TestCase = {
      id: `custom-${Date.now()}`,
      input: firstCase.input,
      expectedOutput: firstCase.expectedOutput,
      isCustom: true
    };

    setTestCases(prev => [...prev, newCase]);
    setActiveTestCase(testCases.length);
    setEditingCase(newCase.id);
  };

  // Remove custom test case
  const removeTestCase = (id: string, index: number) => {
    const testCase = testCases.find(tc => tc.id === id);
    if (!testCase?.isCustom) return;
    
    setTestCases(prev => prev.filter(tc => tc.id !== id));
    
    // Adjust active test case after removal
    if (activeTestCase === index) {
      setActiveTestCase(Math.max(0, index - 1));
    } else if (activeTestCase > index) {
      setActiveTestCase(activeTestCase - 1);
    }
    
    if (editingCase === id) {
      setEditingCase(null);
    }
  };

  // Update test case
  const updateTestCase = (id: string, field: 'input' | 'expectedOutput', value: string) => {
    setTestCases(prev => prev.map(tc => 
      tc.id === id ? { ...tc, [field]: value } : tc
    ));
  };

  // Start editing
  const startEditing = (id: string) => {
    const testCase = testCases.find(tc => tc.id === id);
    if (testCase?.isCustom) {
      setEditingCase(id);
    }
  };

  // Stop editing
  const stopEditing = () => {
    setEditingCase(null);
  };

  // Format test case content for display (handle newlines properly)
  const formatTestCaseContent = (content: string) => {
    if (!content) return '';
    
    // Replace newlines with proper line breaks for display
    return content.split('\n').map((line, index) => (
      <div key={index} className="leading-relaxed">
        {line || '\u00A0'} {/* Use non-breaking space for empty lines */}
      </div>
    ));
  };

  const currentTestCase = testCases[activeTestCase];

  return (
    <div className="h-full flex flex-col bg-primary animate-fade-in">
      {/* Main Tabs Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary bg-secondary">
        <div className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 interactive ${
                activeTab === tab.id
                  ? 'text-brand bg-elevated shadow-sm border border-primary'
                  : 'text-secondary hover:text-primary hover:bg-tertiary'
              }`}
            >
              <span>{tab.name}</span>
              {tab.badge === '!' && (
                <span className="text-xs bg-error-light text-error px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-bold shadow-xs">
                  !
                </span>
              )}
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="text-xs bg-error-light text-error px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
                  {tab.badge}
                </span>
              )}
              {tab.id === 'result' && isLoadingResults && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand"></div>
              )}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          {activeTab === 'testcase' && testCases.length > 0 && (
            <button 
              onClick={addTestCase}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1 shadow-xs"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Testcase</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'testcase' ? (
          <>
            {/* Test Case Tabs - Horizontal */}
            {testCases.length > 0 && (
              <div className="flex items-center px-4 py-2 border-b border-primary bg-secondary/50 overflow-x-auto">
                <div className="flex space-x-1 min-w-max">
                  {testCases.map((testCase, index) => (
                    <div key={testCase.id} className="flex items-center">
                      <button
                        onClick={() => setActiveTestCase(index)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap interactive ${
                          activeTestCase === index
                            ? 'bg-elevated text-brand border border-primary shadow-sm'
                            : 'text-secondary hover:text-primary hover:bg-tertiary'
                        }`}
                      >
                        Case {index + 1}
                        {testCase.isCustom && (
                          <span className="ml-1 text-xs text-brand">*</span>
                        )}
                      </button>
                      
                      {/* Remove button for custom test cases */}
                      {testCase.isCustom && (
                        <button
                          onClick={() => removeTestCase(testCase.id, index)}
                          className="ml-1 text-error hover:bg-error-light text-xs p-1 rounded transition-colors"
                          title="Remove test case"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Case Content */}
            <div className="flex-1 overflow-auto p-4">
              {testCases.length === 0 ? (
                <div className="text-center py-8 text-muted animate-fade-in">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-primary">No test cases available</p>
                  <p className="text-sm text-secondary">Test cases will appear here when the problem loads</p>
                </div>
              ) : currentTestCase ? (
                <div className="max-w-2xl animate-slide-up">
                  {/* Test Case Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-primary">
                        Case {activeTestCase + 1}
                      </h3>
                      {currentTestCase.isCustom && (
                        <span className="text-sm text-brand bg-elevated px-2 py-1 rounded-full border border-primary shadow-xs">
                          Custom
                        </span>
                      )}
                    </div>
                    
                    {/* Edit Controls */}
                    {currentTestCase.isCustom && (
                      <div className="flex items-center space-x-2">
                        {editingCase === currentTestCase.id ? (
                          <button
                            onClick={stopEditing}
                            className="text-sm px-3 py-1 bg-success text-inverse rounded-lg hover:bg-success/90 shadow-sm interactive"
                          >
                            Done
                          </button>
                        ) : (
                          <button
                            onClick={() => startEditing(currentTestCase.id)}
                            className="text-sm text-brand hover:text-brand/80 interactive"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Test Case Data */}
                  <div className="space-y-4">
                    {/* Input */}
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Input:
                      </label>
                      {editingCase === currentTestCase.id ? (
                        <textarea
                          value={currentTestCase.input}
                          onChange={(e) => updateTestCase(currentTestCase.id, 'input', e.target.value)}
                          className="input font-mono text-sm resize-none"
                          rows={4}
                          placeholder="Enter input (each value on a new line if multiple inputs)"
                        />
                      ) : (
                        <div className="bg-elevated border border-primary rounded-lg p-3 font-mono text-sm shadow-xs">
                          {currentTestCase.input ? (
                            formatTestCaseContent(currentTestCase.input)
                          ) : (
                            <div className="text-muted italic">No input provided</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Expected Output */}
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">
                        Expected Output:
                      </label>
                      {editingCase === currentTestCase.id ? (
                        <textarea
                          value={currentTestCase.expectedOutput}
                          onChange={(e) => updateTestCase(currentTestCase.id, 'expectedOutput', e.target.value)}
                          className="input font-mono text-sm resize-none"
                          rows={3}
                          placeholder="Enter expected output (each value on a new line if multiple outputs)"
                        />
                      ) : (
                        <div className="bg-elevated border border-primary rounded-lg p-3 font-mono text-sm shadow-xs">
                          {currentTestCase.expectedOutput ? (
                            formatTestCaseContent(currentTestCase.expectedOutput)
                          ) : (
                            <div className="text-muted italic">No expected output provided</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Explanation (for default test cases) */}
                    {currentTestCase.explanation && !currentTestCase.isCustom && (
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Explanation:
                        </label>
                        <div className="bg-elevated border border-brand/20 rounded-lg p-3 text-sm text-primary shadow-xs">
                          {formatTestCaseContent(currentTestCase.explanation)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          // Test Results Tab
          <div className="flex-1 overflow-auto p-4">
            {isLoadingResults ? (
              <div className="text-center py-8 animate-fade-in">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
                <p className="text-primary">Running your code...</p>
                <p className="text-sm text-secondary mt-1">Please wait while we execute your solution</p>
              </div>
            ) : compilationError ? (
              // Compilation Error Display
              <div className="space-y-4 animate-slide-up">
                <div className="bg-error-light border border-error/20 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-error">Compilation Error</h3>
                  </div>
                  <div className="bg-elevated border border-error/30 rounded-lg p-4 shadow-xs">
                    <pre className="text-sm text-error font-mono whitespace-pre-wrap overflow-x-auto">
                      {compilationError}
                    </pre>
                  </div>
                  <div className="mt-3 text-sm text-error/80">
                    <p><strong>What to check:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Syntax errors (missing semicolons, brackets, etc.)</li>
                      <li>Typos in variable names or method names</li>
                      <li>Missing import statements</li>
                      <li>Incorrect class or method declarations</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : executionError ? (
              // Execution Error Display
              <div className="space-y-4 animate-slide-up">
                <div className="bg-error-light border border-error/20 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-error">Execution Error</h3>
                  </div>
                  <div className="bg-elevated border border-error/30 rounded-lg p-4 shadow-xs">
                    <pre className="text-sm text-error font-mono whitespace-pre-wrap overflow-x-auto">
                      {executionError}
                    </pre>
                  </div>
                </div>
              </div>
            ) : testResults.length === 0 ? (
              <div className="text-center py-8 text-muted animate-fade-in">
                <div className="text-4xl mb-2">🧪</div>
                <p className="text-primary">Run your code to see results here</p>
                <p className="text-sm text-secondary">Test results will appear after running your solution</p>
              </div>
            ) : (
              <div className="space-y-4 animate-slide-up">
                {/* Run Summary */}
                {runSummary && (
                  <div className={`card ${
                    runSummary.allPassed 
                      ? 'bg-success-light border-success/20' 
                      : 'bg-warning-light border-warning/20'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-primary">
                        Execution Summary
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium shadow-xs ${
                        runSummary.allPassed 
                          ? 'bg-success text-inverse' 
                          : 'bg-warning text-inverse'
                      }`}>
                        {runSummary.passedTests}/{runSummary.totalTests} Passed
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-secondary">Execution Time:</span>
                        <span className="ml-2 font-mono text-primary">{runSummary.executionTime.toFixed(3)}s</span>
                      </div>
                      <div>
                        <span className="text-secondary">Memory Usage:</span>
                        <span className="ml-2 font-mono text-primary">{(runSummary.memoryUsage / 1024).toFixed(2)} KB</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Individual Test Results */}
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`card ${
                      result.passed 
                        ? 'bg-success-light border-success/20' 
                        : 'bg-secondary border-error/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-primary">
                        Case {index + 1}
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs shadow-xs ${
                          result.passed 
                            ? 'bg-success text-inverse' 
                            : 'bg-error text-inverse'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                      {result.executionTime > 0 && (
                        <div className="text-xs text-secondary">
                          Runtime: {result.executionTime.toFixed(3)}s
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-secondary">Input: </span>
                        <div className="font-mono bg-elevated p-2 rounded-lg border border-primary inline-block min-w-0 max-w-full overflow-x-auto shadow-xs">
                          {formatTestCaseContent(result.input)}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-secondary">Expected: </span>
                        <div className="font-mono bg-elevated p-2 rounded-lg border border-primary inline-block min-w-0 max-w-full overflow-x-auto shadow-xs">
                          {formatTestCaseContent(result.expectedOutput)}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-secondary">Output: </span>
                        <div className={`font-mono p-2 rounded-lg border inline-block min-w-0 max-w-full overflow-x-auto shadow-xs text-primary ${
                          result.passed 
                            ? 'bg-elevated border-primary' 
                            : 'bg-secondary border-error/50'
                        }`}>
                          {result.actualOutput ? (
                            formatTestCaseContent(result.actualOutput)
                          ) : (
                            <span className="text-muted italic">No output</span>
                          )}
                        </div>
                      </div>
                      
                      {!result.passed && result.errorMessage && (
                        <div>
                          <span className="font-medium text-error">Error: </span>
                          <div className="text-error text-xs font-mono bg-error-light p-2 rounded-lg border border-error/20 mt-1 whitespace-pre-wrap shadow-xs">
                            {result.errorMessage}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
