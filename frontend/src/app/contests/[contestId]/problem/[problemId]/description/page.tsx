'use client';

import { useState } from 'react';
import { useContestProblem } from '../ContestProblemContext';

type TestCase = {
  _id?: string;
  imageUrl?: string;
  input: string;
  output: string;
  explanation?: string;
};

function getDifficultyStyles(difficulty: string) {
  switch ((difficulty || '').toLowerCase()) {
    case 'easy':
      return { backgroundColor: 'var(--success-100)', color: 'var(--success-600)', borderColor: 'var(--success-500)' };
    case 'medium':
      return { backgroundColor: 'var(--warning-100)', color: 'var(--warning-600)', borderColor: 'var(--warning-500)' };
    case 'hard':
      return { backgroundColor: 'var(--error-100)', color: 'var(--error-600)', borderColor: 'var(--error-500)' };
    default:
      return { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderColor: 'var(--border-secondary)' };
  }
}

export default function ContestProblemDescriptionPage() {
  const { data } = useContestProblem();
  const [expandedHints, setExpandedHints] = useState<Set<number>>(new Set());

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[200px] bg-secondary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
        <span className="ml-3 text-secondary">Loading...</span>
      </div>
    );
  }

  const { problem, contest } = data;
  const contestStatus = contest?.status ?? 'upcoming';

  if (contestStatus === 'upcoming') {
    return (
      <div className="min-h-screen bg-secondary">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="card p-8 text-center">
            <h2 className="text-xl font-semibold text-primary mb-2">Contest has not started</h2>
            <p className="text-secondary">Problem details will be available when the contest begins.</p>
          </div>
        </div>
      </div>
    );
  }

  const title = (problem?.title as string) ?? 'Problem';
  const description = (problem?.description as string) ?? '';
  const difficulty = (problem?.difficulty as string) ?? 'easy';
  const visibleTestCases = (problem?.visibleTestCases ?? []) as TestCase[];
  const constraints = (problem?.constraints ?? []) as string[];
  const hints = (problem?.hints ?? []) as string[];

  const toggleHint = (index: number) => {
    setExpandedHints((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="card mb-8 animate-fade-in">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1
                className="text-primary mb-3"
                style={{ fontSize: 'var(--font-size-4xl)', fontWeight: '700', lineHeight: '1.2' }}
              >
                {title}
              </h1>
            </div>
            <span
              className="px-4 py-2 border"
              style={{
                ...getDifficultyStyles(difficulty),
                borderRadius: 'var(--radius-xl)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {(difficulty || 'Easy').charAt(0).toUpperCase() + (difficulty || 'easy').slice(1)}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="card mb-8 animate-slide-up">
          <h2
            className="text-primary mb-4 flex items-center"
            style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600' }}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Description
          </h2>
          <div className="prose max-w-none">
            <p
              className="leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-base)', lineHeight: '1.7' }}
            >
              {description}
            </p>
          </div>
        </div>

        {/* Examples */}
        {visibleTestCases.length > 0 && (
          <div className="mb-8">
            <h2
              className="text-primary mb-6 flex items-center"
              style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600' }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-secondary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
              Examples
            </h2>
            <div className="grid gap-6">
              {visibleTestCases.map((testCase, index) => (
                <div key={index} className="card interactive">
                  <div className="flex items-center mb-6">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mr-4 border"
                      style={{ backgroundColor: 'var(--primary-50)', borderColor: 'var(--primary-200)' }}
                    >
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--primary-700)' }}>
                        {index + 1}
                      </span>
                    </div>
                    <h3 className="text-primary" style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
                      Example {index + 1}
                    </h3>
                  </div>
                  {testCase.imageUrl && (
                    <div className="mb-6">
                      <img
                        src={testCase.imageUrl}
                        alt={`Example ${index + 1}`}
                        className="max-w-full h-auto border"
                        style={{ borderRadius: 'var(--radius-xl)', borderColor: 'var(--border-primary)', maxHeight: '300px' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center mb-3" style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Input
                      </label>
                      <pre
                        className="border font-mono text-sm whitespace-pre-wrap overflow-x-auto"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)',
                          padding: 'var(--spacing-lg)',
                          borderRadius: 'var(--radius-lg)',
                        }}
                      >
                        {testCase.input}
                      </pre>
                    </div>
                    <div>
                      <label className="flex items-center mb-3" style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Output
                      </label>
                      <pre
                        className="border font-mono text-sm whitespace-pre-wrap overflow-x-auto"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)',
                          padding: 'var(--spacing-lg)',
                          borderRadius: 'var(--radius-lg)',
                        }}
                      >
                        {testCase.output}
                      </pre>
                    </div>
                    {testCase.explanation && (
                      <div
                        className="mt-6 border overflow-hidden"
                        style={{
                          borderColor: 'var(--primary-200)',
                          borderRadius: 'var(--radius-xl)',
                          backgroundColor: 'var(--bg-elevated)',
                        }}
                      >
                        <div className="px-4 py-3 border-b" style={{ backgroundColor: 'var(--primary-50)', borderColor: 'var(--primary-200)' }}>
                          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--primary-800)' }}>Explanation</span>
                        </div>
                        <div style={{ padding: 'var(--spacing-lg)', backgroundColor: 'var(--bg-primary)' }}>
                          <p className="leading-relaxed" style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', lineHeight: '1.6' }}>
                            {testCase.explanation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Constraints */}
        {constraints.length > 0 && (
          <div className="card mb-8">
            <h2
              className="text-primary mb-6 flex items-center"
              style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600' }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-secondary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Constraints
            </h2>
            <div className="grid gap-3">
              {constraints.map((constraint, index) => (
                <div
                  key={index}
                  className="flex items-center border"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)',
                    padding: 'var(--spacing-lg)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full mr-4 flex-shrink-0" style={{ backgroundColor: 'var(--text-muted)' }} />
                  <code className="font-mono" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                    {constraint}
                  </code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hints */}
        {hints.length > 0 && (
          <div className="mb-8">
            <h2
              className="text-primary mb-6 flex items-center"
              style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600' }}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-secondary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Hints
            </h2>
            <div className="space-y-4">
              {hints.map((hint, index) => (
                <div key={index} className="bg-elevated border overflow-hidden" style={{ borderRadius: 'var(--radius-2xl)' }}>
                  <button
                    type="button"
                    onClick={() => toggleHint(index)}
                    className="w-full text-left flex items-center justify-between focus:outline-none"
                    style={{ padding: 'var(--spacing-xl)', backgroundColor: expandedHints.has(index) ? 'var(--bg-secondary)' : 'transparent' }}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 border" style={{ backgroundColor: 'var(--primary-100)', borderColor: 'var(--primary-200)' }}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--primary-700)' }}>
                          <path fillRule="evenodd" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-primary" style={{ fontSize: 'var(--font-size-base)', fontWeight: '600' }}>Hint {index + 1}</span>
                    </div>
                    <svg className={`w-5 h-5 transition-transform ${expandedHints.has(index) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-tertiary)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedHints.has(index) && (
                    <div className="border-t" style={{ borderColor: 'var(--border-primary)', padding: 'var(--spacing-xl)' }}>
                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-xl)' }}>
                        <p className="leading-relaxed" style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>{hint}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
