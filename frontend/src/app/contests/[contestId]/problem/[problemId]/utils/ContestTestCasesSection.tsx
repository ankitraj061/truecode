'use client';

import { useState, useEffect } from 'react';
import { useContestProblem } from '../ContestProblemContext';

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

export default function ContestTestCasesSection() {
  const { data } = useContestProblem();
  const problem = data?.problem;

  const [activeTab, setActiveTab] = useState('testcase');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [editingCase, setEditingCase] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [compilationError, setCompilationError] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  useEffect(() => {
    if (problem?.visibleTestCases && Array.isArray(problem.visibleTestCases)) {
      const cases: TestCase[] = (problem.visibleTestCases as { input?: string; output?: string; explanation?: string }[]).map((tc, i) => ({
        id: `default-${i}`,
        input: tc.input ?? '',
        expectedOutput: tc.output ?? '',
        explanation: tc.explanation,
        isCustom: false,
      }));
      setTestCases(cases.length ? cases : []);
      setActiveTestCase(0);
    }
  }, [problem?.visibleTestCases]);

  useEffect(() => {
    window.testCasesData = testCases.map((tc) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isCustom: tc.isCustom,
    }));
  }, [testCases]);

  useEffect(() => {
    const handleResultsUpdate = (event: Event) => {
      const e = event as CustomEvent<{
        testResults?: TestResult[];
        runSummary?: RunSummary;
        error?: { compilationError?: string; error?: string; message?: string };
      }>;
      const { testResults: res, runSummary: sum, error: err } = e.detail ?? {};
      setCompilationError(null);
      setExecutionError(null);
      if (err) {
        if (err.compilationError) setCompilationError(err.compilationError);
        else setExecutionError(err.message || err.error || 'Execution failed');
        setTestResults([]);
        setRunSummary(null);
      } else {
        setTestResults(res ?? []);
        setRunSummary(sum ?? null);
      }
      setIsLoadingResults(false);
    };
    const handleSwitchToResults = () => {
      setActiveTab('result');
      setIsLoadingResults(true);
      setTestResults([]);
      setRunSummary(null);
      setCompilationError(null);
      setExecutionError(null);
    };
    window.addEventListener('testResultsUpdated', handleResultsUpdate as EventListener);
    window.addEventListener('switchToResults', handleSwitchToResults);
    return () => {
      window.removeEventListener('testResultsUpdated', handleResultsUpdate as EventListener);
      window.removeEventListener('switchToResults', handleSwitchToResults);
    };
  }, []);

  const addTestCase = () => {
    const first = testCases[0];
    if (!first) return;
    const newCase: TestCase = {
      id: `custom-${Date.now()}`,
      input: first.input,
      expectedOutput: first.expectedOutput,
      isCustom: true,
    };
    setTestCases((prev) => [...prev, newCase]);
    setActiveTestCase(testCases.length);
    setEditingCase(newCase.id);
  };

  const removeTestCase = (id: string, index: number) => {
    const tc = testCases.find((t) => t.id === id);
    if (!tc?.isCustom) return;
    setTestCases((prev) => prev.filter((t) => t.id !== id));
    setActiveTestCase((a) => (a === index ? Math.max(0, index - 1) : a > index ? a - 1 : a));
    if (editingCase === id) setEditingCase(null);
  };

  const updateTestCase = (id: string, field: 'input' | 'expectedOutput', value: string) => {
    setTestCases((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const formatContent = (content: string) =>
    content.split('\n').map((line, i) => (
      <div key={i} className="leading-relaxed">
        {line || '\u00A0'}
      </div>
    ));

  const currentTestCase = testCases[activeTestCase];
  const tabs = [
    { id: 'testcase', name: 'Testcase' },
    {
      id: 'result',
      name: 'Test Result',
      badge: compilationError || executionError ? '!' : (testResults.length > 0 ? testResults.filter((r) => !r.passed).length : null),
    },
  ];

  return (
    <div className="h-full flex flex-col bg-primary">
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary bg-secondary">
        <div className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm font-medium px-3 py-2 rounded-lg flex items-center space-x-2 interactive ${
                activeTab === tab.id ? 'text-brand bg-elevated border border-primary' : 'text-secondary hover:text-primary hover:bg-tertiary'
              }`}
            >
              <span>{tab.name}</span>
              {tab.badge === '!' && <span className="text-xs bg-error/20 text-error px-1.5 py-0.5 rounded-full">!</span>}
              {typeof tab.badge === 'number' && tab.badge > 0 && <span className="text-xs bg-error/20 text-error px-1.5 py-0.5 rounded-full">{tab.badge}</span>}
              {tab.id === 'result' && isLoadingResults && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand" />}
            </button>
          ))}
        </div>
        {activeTab === 'testcase' && testCases.length > 0 && (
          <button type="button" onClick={addTestCase} className="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span>Add Testcase</span>
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'testcase' ? (
          <>
            {testCases.length > 0 && (
              <div className="flex items-center px-4 py-2 border-b border-primary bg-secondary/50 overflow-x-auto">
                <div className="flex space-x-1 min-w-max">
                  {testCases.map((tc, index) => (
                    <div key={tc.id} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setActiveTestCase(index)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap interactive ${
                          activeTestCase === index ? 'bg-elevated text-brand border border-primary' : 'text-secondary hover:text-primary hover:bg-tertiary'
                        }`}
                      >
                        Case {index + 1}
                        {tc.isCustom && <span className="ml-1 text-xs text-brand">*</span>}
                      </button>
                      {tc.isCustom && (
                        <button type="button" onClick={() => removeTestCase(tc.id, index)} className="ml-1 text-error hover:bg-error/10 text-xs p-1 rounded" title="Remove">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex-1 overflow-auto p-4">
              {testCases.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <p className="text-primary">No test cases available</p>
                </div>
              ) : currentTestCase ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-primary">Case {activeTestCase + 1}</h3>
                    {currentTestCase.isCustom && editingCase === currentTestCase.id && (
                      <button type="button" onClick={() => setEditingCase(null)} className="text-sm text-brand">Done</button>
                    )}
                    {currentTestCase.isCustom && editingCase !== currentTestCase.id && (
                      <button type="button" onClick={() => setEditingCase(currentTestCase.id)} className="text-sm text-brand">Edit</button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Input:</label>
                    {editingCase === currentTestCase.id ? (
                      <textarea
                        value={currentTestCase.input}
                        onChange={(e) => updateTestCase(currentTestCase.id, 'input', e.target.value)}
                        className="input font-mono text-sm w-full resize-none"
                        rows={4}
                      />
                    ) : (
                      <div className="bg-elevated border border-primary rounded-lg p-3 font-mono text-sm">
                        {currentTestCase.input ? formatContent(currentTestCase.input) : <span className="text-muted italic">No input</span>}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Expected Output:</label>
                    {editingCase === currentTestCase.id ? (
                      <textarea
                        value={currentTestCase.expectedOutput}
                        onChange={(e) => updateTestCase(currentTestCase.id, 'expectedOutput', e.target.value)}
                        className="input font-mono text-sm w-full resize-none"
                        rows={3}
                      />
                    ) : (
                      <div className="bg-elevated border border-primary rounded-lg p-3 font-mono text-sm">
                        {currentTestCase.expectedOutput ? formatContent(currentTestCase.expectedOutput) : <span className="text-muted italic">No output</span>}
                      </div>
                    )}
                  </div>
                  {currentTestCase.explanation && !currentTestCase.isCustom && (
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-2">Explanation:</label>
                      <div className="bg-elevated border border-primary rounded-lg p-3 text-sm">{formatContent(currentTestCase.explanation)}</div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-auto p-4">
            {isLoadingResults ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4" />
                <p className="text-primary">Running your code...</p>
              </div>
            ) : compilationError ? (
              <div className="bg-error/10 border border-error/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-error mb-2">Compilation Error</h3>
                <pre className="text-sm text-error font-mono whitespace-pre-wrap">{compilationError}</pre>
              </div>
            ) : executionError ? (
              <div className="bg-error/10 border border-error/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-error mb-2">Execution Error</h3>
                <pre className="text-sm text-error font-mono whitespace-pre-wrap">{executionError}</pre>
              </div>
            ) : testResults.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <p className="text-primary">Run your code to see results here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {runSummary && (
                  <div className={`rounded-lg border p-4 ${runSummary.allPassed ? 'bg-success/10 border-success/30' : 'bg-warning/10 border-warning/30'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-primary">Execution Summary</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${runSummary.allPassed ? 'bg-success text-white' : 'bg-warning text-white'}`}>
                        {runSummary.passedTests}/{runSummary.totalTests} Passed
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-secondary">
                      <span>Execution Time: {runSummary.executionTime.toFixed(3)}s</span>
                      <span>Memory: {(runSummary.memoryUsage / 1024).toFixed(2)} KB</span>
                    </div>
                  </div>
                )}
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`rounded-lg border p-4 ${result.passed ? 'bg-success/10 border-success/30' : 'bg-error/10 border-error/30'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-primary">
                        Case {index + 1}
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${result.passed ? 'bg-success text-white' : 'bg-error text-white'}`}>{result.status}</span>
                      </span>
                      {result.executionTime > 0 && <span className="text-xs text-secondary">{result.executionTime.toFixed(3)}s</span>}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium text-secondary">Input: </span><div className="font-mono bg-elevated p-2 rounded border border-primary mt-1">{formatContent(result.input)}</div></div>
                      <div><span className="font-medium text-secondary">Expected: </span><div className="font-mono bg-elevated p-2 rounded border border-primary mt-1">{formatContent(result.expectedOutput)}</div></div>
                      <div><span className="font-medium text-secondary">Output: </span><div className={`font-mono p-2 rounded border mt-1 ${result.passed ? 'bg-elevated border-primary' : 'bg-error/10 border-error/30'}`}>{result.actualOutput ? formatContent(result.actualOutput) : <span className="text-muted italic">No output</span>}</div></div>
                      {!result.passed && result.errorMessage && <div className="text-error text-xs font-mono mt-1">{result.errorMessage}</div>}
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
