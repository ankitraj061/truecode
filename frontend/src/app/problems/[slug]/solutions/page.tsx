'use client';
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import { useEffect, useState } from "react";
import { axiosClient } from "@/app/utils/axiosClient";


type Solution = {
  _id: string;
  language: string;
  completeCode: string;
  timeComplexity?: string;
  spaceComplexity?: string;
};


export default function ProblemSolutionsPage() {
    const { problem } = useSelector((state: RootState) => state.problem);
    const [solutions, setSolutions] = useState<Solution[]>([]);
    const [loading, setLoading] = useState(true); // Add loading state
    const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

    useEffect(() => {
        const getSolutions = async () => {
            try {
                setLoading(true); // Start loading
                if (!problem) return;
                const res = await axiosClient.get(`/api/user/problem/${problem._id}/solution`);
                setSolutions(res.data.referenceSolution || []);
            } catch (err) {
            } finally {
                setLoading(false); // End loading
            }
        };
        getSolutions();
    }, [problem]);

    // Copy code to clipboard
    const handleCopyCode = async (code: string, solutionId: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedStates(prev => ({ ...prev, [solutionId]: true }));
            
            // Reset copied state after 2 seconds
            setTimeout(() => {
                setCopiedStates(prev => ({ ...prev, [solutionId]: false }));
            }, 2000);
        } catch (err) {
        }
    };

    // Language colors for badges
    const getLanguageColor = (language: string) => {
        const lang = language?.toLowerCase() || '';
        switch (lang) {
            case 'javascript': return 'bg-accent text-white';
            case 'python': return 'bg-brand text-white';
            case 'java': return 'bg-error text-white';
            case 'cpp':
            case 'c++': return 'bg-success text-white';
            case 'c': return 'bg-warning text-white';
            default: return 'bg-tertiary text-primary';
        }
    };

    // Skeleton loading component
    const SolutionSkeleton = () => (
        <div className="card space-y-6">
            {/* Header skeleton */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="skeleton w-20 h-8 rounded-full"></div>
                    <div className="skeleton w-16 h-4 rounded"></div>
                </div>
                <div className="skeleton w-20 h-8 rounded-md"></div>
            </div>

            {/* Code block skeleton */}
            <div className="space-y-3">
                <div className="skeleton w-full h-6 rounded"></div>
                <div className="skeleton w-5/6 h-6 rounded"></div>
                <div className="skeleton w-4/5 h-6 rounded"></div>
                <div className="skeleton w-full h-6 rounded"></div>
                <div className="skeleton w-3/4 h-6 rounded"></div>
                <div className="skeleton w-5/6 h-6 rounded"></div>
                <div className="skeleton w-2/3 h-6 rounded"></div>
            </div>

            {/* Complexity skeleton */}
            <div className="bg-secondary rounded-lg p-4 space-y-3">
                <div className="skeleton w-32 h-5 rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="skeleton w-full h-12 rounded-md"></div>
                    <div className="skeleton w-full h-12 rounded-md"></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-6 px-4 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center space-x-3 mb-2">
                    <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h1 className="text-3xl font-bold text-primary">
                        Reference Solutions
                    </h1>
                </div>
                <p className="text-secondary">
                    Explore optimized solutions with detailed complexity analysis
                </p>
            </div>

            {/* Loading State - Show Skeletons */}
            {loading ? (
                <div className="space-y-6">
                    <SolutionSkeleton />
                    <SolutionSkeleton />
                </div>
            ) : solutions.length === 0 ? (
                /* No Solutions State - Show After Loading */
                <div className="card text-center py-12 animate-slide-up">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-primary mb-2">No Solutions Available</h3>
                            <p className="text-tertiary">Reference solutions haven&apos;t been added for this problem yet.</p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Solutions List - Show After Loading with Data */
                <div className="space-y-6">
                    {solutions.map((sol, idx) => (
                        <div
                            key={sol._id}
                            className="card hover:shadow-lg transition-all duration-300 animate-slide-up"
                        >
                            {/* Solution Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center space-x-3">
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getLanguageColor(sol.language)}`}>
                                        {sol.language?.toUpperCase() || "UNKNOWN"}
                                    </span>
                                    <span className="text-tertiary text-sm font-medium">
                                        Solution {idx + 1}
                                    </span>
                                </div>
                                
                                {/* Copy Button */}
                                <button
                                    onClick={() => handleCopyCode(sol.completeCode, sol._id)}
                                    className="btn-secondary flex items-center space-x-2 px-3 py-2 text-sm interactive"
                                    title="Copy code to clipboard"
                                >
                                    {copiedStates[sol._id] ? (
                                        <>
                                            <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-success">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Code Block */}
                            <div className="relative mb-6 group">
                                <pre className="bg-elevated text-primary p-4 rounded-lg overflow-auto text-sm font-mono border border-primary shadow-sm">
                                    <code className="whitespace-pre-wrap break-words">
{sol.completeCode}
                                    </code>
                                </pre>
                                
                                {/* Language indicator in code block */}
                                <div className="absolute top-3 right-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-muted font-medium">
                                        {sol.language?.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Complexity Analysis */}
                            <div className="bg-secondary rounded-lg p-4 space-y-3">
                                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center space-x-2">
                                    <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span>Complexity Analysis</span>
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between p-3 bg-primary rounded-md border border-primary">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-error rounded-full"></div>
                                            <span className="font-medium text-primary text-sm">Time:</span>
                                        </div>
                                        <code className="text-brand font-mono text-sm bg-tertiary px-2 py-1 rounded">
                                            {sol.timeComplexity || "O(?)"}
                                        </code>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 bg-primary rounded-md border border-primary">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-warning rounded-full"></div>
                                            <span className="font-medium text-primary text-sm">Space:</span>
                                        </div>
                                        <code className="text-brand font-mono text-sm bg-tertiary px-2 py-1 rounded">
                                            {sol.spaceComplexity || "O(?)"}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
