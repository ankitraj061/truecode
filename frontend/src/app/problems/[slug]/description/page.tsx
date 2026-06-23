"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import PremiumModal from "@/app/components/PremiumModal";
import DiscussionSection from "./utils/DiscussionSection";
import { RootState } from "@/app/store/store";
import { useRouter } from "next/navigation";

type TestCase = {
  _id: string;
  imageUrl?: string;
  input: string;
  output: string;
  explanation?: string;
};

export default function ProblemDescriptionPage() {
  const router = useRouter();
  const { problem } = useSelector((state: RootState) => state.problem);
  const { isAuthenticated, user, loading } = useSelector(
    (state: RootState) => state.auth
  );
  const { userStatus } = useSelector((state: RootState) => state.problem);
  const dispatch = useDispatch();

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [expandedHints, setExpandedHints] = useState<Set<number>>(new Set());

  if (!problem) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 mx-auto bg-tertiary rounded-full flex items-center justify-center shadow-sm">
            <svg 
              className="w-8 h-8 text-tertiary" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-secondary font-medium">No problem found</p>
        </div>
      </div>
    );
  }

  const handleCompaniesClick = () => {
    if (user?.subscriptionType !== "premium") {
      setShowPremiumModal(true);
    }
  };

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return {
          backgroundColor: 'var(--success-100)',
          color: 'var(--success-600)',
          borderColor: 'var(--success-500)',
        };
      case "medium":
        return {
          backgroundColor: 'var(--warning-100)',
          color: 'var(--warning-600)',
          borderColor: 'var(--warning-500)',
        };
      case "hard":
        return {
          backgroundColor: 'var(--error-100)',
          color: 'var(--error-600)',
          borderColor: 'var(--error-500)',
        };
      default:
        return {
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          borderColor: 'var(--border-secondary)',
        };
    }
  };

  const getAcceptanceRate = () => {
    if (problem.totalSubmissions === 0) return 0;
    return Math.round(
      (problem.totalAcceptedSubmissions / problem.totalSubmissions) * 100
    );
  };

  const toggleHint = (index: number) => {
    setExpandedHints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const StatusIcon = () => {
    if (userStatus?.isSolvedByUser) {
      return (
        <div 
          className="flex items-center justify-center w-8 h-8 rounded-full border shadow-sm"
          style={{
            backgroundColor: 'var(--success-100)',
            borderColor: 'var(--success-500)',
          }}
          title="Solved"
        >
          <svg 
            className="w-5 h-5" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            style={{ color: 'var(--success-600)' }}
          >
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    } else if (userStatus?.isAttemptedByUser) {
      return (
        <div 
          className="flex items-center justify-center w-8 h-8 rounded-full border shadow-sm"
          style={{
            backgroundColor: 'var(--warning-100)',
            borderColor: 'var(--warning-500)',
          }}
          title="Attempted"
        >
          <svg 
            className="w-5 h-5" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            style={{ color: 'var(--warning-600)' }}
          >
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header Section with Custom Properties */}
        <div className="card mb-8 animate-fade-in">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <StatusIcon />
              <div>
                <h1 className="text-primary mb-3" style={{ 
                  fontSize: 'var(--font-size-4xl)',
                  fontWeight: '700',
                  lineHeight: '1.2'
                }}>
                  {problem.title}
                </h1>
                <div className="flex items-center space-x-6" style={{ fontSize: 'var(--font-size-sm)' }}>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--success-500)' }}
                    ></div>
                    <span className="text-secondary">
                      Accepted: <span style={{ color: 'var(--success-600)', fontWeight: '600' }}>
                        {problem.totalAcceptedSubmissions.toLocaleString()}
                      </span>
                    </span>
                  </div>
                  <div 
                    className="w-px h-4"
                    style={{ backgroundColor: 'var(--border-secondary)' }}
                  ></div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--text-muted)' }}
                    ></div>
                    <span className="text-secondary">
                      Submissions: <span style={{ fontWeight: '600' }}>
                        {problem.totalSubmissions.toLocaleString()}
                      </span>
                    </span>
                  </div>
                  <div 
                    className="w-px h-4"
                    style={{ backgroundColor: 'var(--border-secondary)' }}
                  ></div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--primary-500)' }}
                    ></div>
                    <span className="text-secondary">
                      Acceptance: <span style={{ color: 'var(--primary-600)', fontWeight: '600' }}>
                        {getAcceptanceRate()}%
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <span 
              className="px-4 py-2 border"
              style={{
                ...getDifficultyStyles(problem.difficulty),
                borderRadius: 'var(--radius-xl)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
            </span>
          </div>
        </div>

        {/* Description Section */}
        <div className="card mb-8 animate-slide-up">
          <h2 
            className="text-primary mb-4 flex items-center"
            style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600' }}
          >
            <svg 
              className="w-5 h-5 mr-3" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: 'var(--text-secondary)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Description
          </h2>
          <div className="prose max-w-none">
            <p 
              className="leading-relaxed whitespace-pre-wrap"
              style={{ 
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-base)',
                lineHeight: '1.7'
              }}
            >
              {problem.description}
            </p>
          </div>
        </div>

        {/* Examples Section */}
        {problem.visibleTestCases && problem.visibleTestCases.length > 0 && (
          <div className="mb-8">
            <h2 
              className="text-primary mb-6 flex items-center"
              style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600' }}
            >
              <svg 
                className="w-5 h-5 mr-3" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: 'var(--text-secondary)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
              Examples
            </h2>
            <div className="grid gap-6">
              {problem.visibleTestCases.map((testCase: TestCase, index: number) => (
                <div key={testCase._id} className="card interactive">
                  <div className="flex items-center mb-6">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center mr-4 border"
                      style={{
                        backgroundColor: 'var(--primary-50)',
                        borderColor: 'var(--primary-200)',
                      }}
                    >
                      <span 
                        style={{ 
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: '600',
                          color: 'var(--primary-700)'
                        }}
                      >
                        {index + 1}
                      </span>
                    </div>
                    <h3 
                      className="text-primary"
                      style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600' }}
                    >
                      Example {index + 1}
                    </h3>
                  </div>

                  {testCase.imageUrl && (
                    <div className="mb-6">
                      <img
                        src={testCase.imageUrl}
                        alt={`Example ${index + 1} illustration`}
                        className="max-w-full h-auto border"
                        style={{ 
                          borderRadius: 'var(--radius-xl)',
                          borderColor: 'var(--border-primary)',
                          backgroundColor: 'var(--bg-primary)',
                          padding: 'var(--spacing-lg)',
                          boxShadow: 'var(--shadow-sm)',
                          maxHeight: "300px"
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label 
                        className="flex items-center mb-3"
                        style={{ 
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: '600',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <svg 
                          className="w-4 h-4 mr-2" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Input
                      </label>
                      <pre 
                        className="border font-mono text-sm whitespace-pre-wrap overflow-x-auto transition-colors duration-200"
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
                      <label 
                        className="flex items-center mb-3"
                        style={{ 
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: '600',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <svg 
                          className="w-4 h-4 mr-2" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Output
                      </label>
                      <pre 
                        className="border font-mono text-sm whitespace-pre-wrap overflow-x-auto transition-colors duration-200"
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
      boxShadow: 'var(--shadow-sm)',
    }}
  >
    <div 
      className="px-4 py-3 border-b"
      style={{
        backgroundColor: 'var(--primary-50)',
        borderColor: 'var(--primary-200)',
      }}
    >
      <div className="flex items-center">
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center mr-3"
          style={{
            backgroundColor: 'var(--primary-100)',
            border: `1px solid var(--primary-300)`
          }}
        >
          <svg 
            className="w-3 h-3" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: 'var(--primary-600)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: '600',
            color: 'var(--text-primary)',
            letterSpacing: '0.025em'
          }}
        >
          Explanation
        </span>
      </div>
    </div>
    <div 
      style={{ 
        padding: 'var(--spacing-lg)',
        backgroundColor: 'var(--bg-primary)'
      }}
    >
      <p 
        className="leading-relaxed"
        style={{ 
          color: 'var(--text-primary)',
          fontSize: 'var(--font-size-sm)',
          lineHeight: '1.6'
        }}
      >
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

        {/* Constraints Section */}
        {problem.constraints && problem.constraints.length > 0 && (
          <div className="card mb-8">
            <h2 
              className="text-primary mb-6 flex items-center"
              style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600' }}
            >
              <svg 
                className="w-5 h-5 mr-3" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: 'var(--text-secondary)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Constraints
            </h2>
            <div className="grid gap-3">
              {problem.constraints.map((constraint: string, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center border transition-colors duration-200"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)',
                    padding: 'var(--spacing-lg)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div 
                    className="w-1.5 h-1.5 rounded-full mr-4 flex-shrink-0"
                    style={{ backgroundColor: 'var(--text-muted)' }}
                  ></div>
                  <code 
                    className="font-mono"
                    style={{ 
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {constraint}
                  </code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Hints Section */}
        {problem.hints && problem.hints.length > 0 && (
          <div className="mb-8">
            <h2 
              className="text-primary mb-6 flex items-center"
              style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600' }}
            >
              <svg 
                className="w-5 h-5 mr-3" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: 'var(--text-secondary)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Hints
            </h2>
            <div className="space-y-4">
              {problem.hints.map((hint: string, index: number) => (
                <div 
                  key={index} 
                  className="bg-elevated border overflow-hidden"
                  style={{ borderRadius: 'var(--radius-2xl)' }}
                >
                  <button
                    onClick={() => toggleHint(index)}
                    className="w-full text-left transition-colors duration-200 flex items-center justify-between focus:outline-none"
                    style={{ 
                      padding: 'var(--spacing-xl)',
                      backgroundColor: expandedHints.has(index) ? 'var(--bg-secondary)' : 'transparent'
                    }}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center mr-4 border"
                        style={{
                          backgroundColor: 'var(--primary-100)',
                          borderColor: 'var(--primary-200)',
                        }}
                      >
                        <svg 
                          className="w-4 h-4" 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                          style={{ color: 'var(--primary-700)' }}
                        >
                          <path fillRule="evenodd" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span 
                        className="text-primary"
                        style={{ fontSize: 'var(--font-size-base)', fontWeight: '600' }}
                      >
                        Hint {index + 1}
                      </span>
                    </div>
                    <svg 
                      className={`w-5 h-5 transition-transform duration-200 ${expandedHints.has(index) ? "rotate-180" : ""}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedHints.has(index) && (
                    <div 
                      className="border-t"
                      style={{ 
                        borderColor: 'var(--border-primary)',
                        padding: 'var(--spacing-xl)'
                      }}
                    >
                      <div 
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          padding: 'var(--spacing-lg)',
                          borderRadius: 'var(--radius-xl)',
                        }}
                      >
                        <p 
                          className="leading-relaxed"
                          style={{ 
                            color: 'var(--text-primary)',
                            fontSize: 'var(--font-size-sm)'
                          }}
                        >
                          {hint}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Companies Section */}
       {/* Companies Section - Fixed Dark Mode Visibility */}
{problem.companies && problem.companies.length > 0 && (
  <div className="card mb-8">
    <h2 
      className="text-primary mb-6 flex items-center"
      style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600' }}
    >
      <svg 
        className="w-5 h-5 mr-3" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        style={{ color: 'var(--text-secondary)' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      Companies
    </h2>
    {user?.subscriptionType === "premium" ? (
      <div className="flex flex-wrap gap-4">
        {problem.companies.map((company: string, index: number) => (
          <span
            key={index}
            className="inline-flex items-center border interactive cursor-pointer transition-all duration-200"
            style={{
              backgroundColor: 'var(--primary-50)',
              borderColor: 'var(--primary-200)',
              color: 'var(--primary-800)',
              padding: `var(--spacing-md) var(--spacing-xl)`,
              borderRadius: 'var(--radius-xl)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '600',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            {company}
          </span>
        ))}
      </div>
    ) : (
      <button
        onClick={handleCompaniesClick}
        className="interactive flex items-center border transition-all duration-200 focus:outline-none"
        style={{
          backgroundColor: 'var(--accent-50)',
          borderColor: 'var(--accent-300)',
          color: 'var(--accent-700)',
          padding: `var(--spacing-lg) var(--spacing-xl)`,
          borderRadius: 'var(--radius-xl)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: '600',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <svg 
          className="w-5 h-5 mr-3" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          style={{ color: 'var(--accent-600)' }}
        >
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        {/* <span style={{ color: 'var(--text-primary)' }}>Show Companies</span> */}
        <span 
          className="ml-3 px-3 py-1 rounded-full border"
          style={{
            backgroundColor: 'var(--accent-100)',
            borderColor: 'var(--accent-200)',
            color: 'var(--accent-800)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: '700'
          }}
        >
          Premium
        </span>
      </button>
    )}
  </div>
)}


        {/* Tags Section */}
        {problem.tags && problem.tags.length > 0 && (
          <div className="card mb-8">
            <h2 
              className="text-primary mb-6 flex items-center"
              style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600' }}
            >
              <svg 
                className="w-5 h-5 mr-3" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: 'var(--text-secondary)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Related Topics
            </h2>
            <div className="flex flex-wrap gap-3">
              {problem.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center border interactive cursor-pointer transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)',
                    padding: `${getDimension('var(--spacing-md)')} ${getDimension('var(--spacing-xl)')}`,
                    borderRadius: 'var(--radius-xl)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '600',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <span 
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: 'var(--text-muted)' }}
                  ></span>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Discussion Section */}
        <div className="bg-elevated border overflow-hidden mb-8"
             style={{ borderRadius: 'var(--radius-2xl)' }}
        >
          <button
            onClick={() => setShowDiscussion(!showDiscussion)}
            className="w-full text-left transition-colors duration-200 focus:outline-none"
            style={{ 
              padding: 'var(--spacing-2xl)',
              backgroundColor: showDiscussion ? 'var(--bg-secondary)' : 'transparent'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center border"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-secondary)',
                  }}
                >
                  <svg 
                    className="w-6 h-6" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h2 
                    className="text-primary"
                    style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600' }}
                  >
                    Discussion
                  </h2>
                  <p 
                    className="text-secondary"
                    style={{ 
                      fontSize: 'var(--font-size-sm)',
                      marginTop: 'var(--spacing-xs)'
                    }}
                  >
                    {problem.totalDiscussionCount || 0} {problem.totalDiscussionCount === 1 ? 'discussion' : 'discussions'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span 
                  className="px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '600'
                  }}
                >
                  {problem.totalDiscussionCount || 0}
                </span>
                <svg 
                  className={`w-5 h-5 transition-transform duration-200 ${showDiscussion ? "rotate-180" : ""}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </button>

          {showDiscussion && (
            <div 
              className="border-t animate-fade-in"
              style={{ 
                borderColor: 'var(--border-primary)',
                backgroundColor: 'var(--bg-secondary)',
                padding: 'var(--spacing-2xl)'
              }}
            >
              <DiscussionSection problemId={problem._id} />
            </div>
          )}
        </div>
      </div>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        problemTitle={problem.title}
      />
    </div>
  );
}

// Helper function to get dimension values
function getDimension(cssVar: string): string {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(cssVar.replace('var(', '').replace(')', ''));
  }
  return '0.75rem'; // fallback
}
