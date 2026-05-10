'use client';
import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/app/store/store";
import { addMessage, setMessages } from "@/app/slices/chatSlice";
import { axiosClient } from "@/app/utils/axiosClient";
import Loader from "@/app/components/TruckLoader";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AxiosError } from "axios";

// TypeScript types
export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface ChatResponse {
    success: boolean;
    data: {
        response: string;
        isOffTopic: boolean;
        tokensUsed: number;
        model?: string;
        problemDifficulty?: string;
        availableHints?: number;
    };
}

// Enhanced Code Block Component with better styling
function CodeBlock({ code, language }: { code: string; language: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
        }
    };

    return (
        <div className="relative my-3 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700" style={{ backgroundColor: '#1e1e1e' }}>
            {/* Header Bar - VS Code style */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700" style={{ backgroundColor: '#2d2d30' }}>
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-300 capitalize tracking-wide">
                        {language || 'code'}
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-md transition-all duration-200 font-medium"
                    style={{
                        backgroundColor: copied ? '#10b981' : '#3b3b3b',
                        color: copied ? '#ffffff' : '#d4d4d4',
                    }}
                >
                    {copied ? (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copy code</span>
                        </>
                    )}
                </button>
            </div>
            
            {/* Code Content with Syntax Highlighting */}
            <div className="overflow-x-auto" style={{ backgroundColor: '#1e1e1e' }}>
                <SyntaxHighlighter
                    language={language || 'javascript'}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        padding: '1.25rem',
                        backgroundColor: '#1e1e1e',
                        fontSize: '0.875rem',
                        lineHeight: '1.6',
                        fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
                    }}
                    showLineNumbers={true}
                    wrapLines={true}
                    lineNumberStyle={{
                        minWidth: '3.5em',
                        paddingRight: '1.5em',
                        color: '#858585',
                        textAlign: 'right',
                        userSelect: 'none',
                        borderRight: '1px solid #3e3e42',
                        marginRight: '1em',
                    }}
                    codeTagProps={{
                        style: {
                            fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
                            fontSize: '0.875rem',
                        }
                    }}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}

// Parse message content to detect code blocks (```lang\ncode```)
function parseMessageContent(content: string) {
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            const textContent = content.slice(lastIndex, match.index).trim();
            if (textContent) {
                parts.push({ type: 'text', content: textContent });
            }
        }
        parts.push({
            type: 'code',
            content: match[2].trim(),
            language: (match[1] || 'text').toLowerCase() || 'text'
        });
        lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < content.length) {
        const remainingContent = content.slice(lastIndex).trim();
        if (remainingContent) {
            parts.push({ type: 'text', content: remainingContent });
        }
    }

    return parts.length > 0 ? parts : [{ type: 'text' as const, content }];
}

// Render text with **bold** and `inline code` (ChatGPT-style)
function MarkdownText({ text }: { text: string }) {
    const segments: React.ReactNode[] = [];
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
    parts.forEach((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            segments.push(<strong key={i} className="font-semibold text-primary">{part.slice(2, -2)}</strong>);
        } else if (part.startsWith('`') && part.endsWith('`')) {
            segments.push(
                <code
                    key={i}
                    className="px-1.5 py-0.5 rounded text-sm font-mono bg-secondary border border-border-primary text-brand"
                >
                    {part.slice(1, -1)}
                </code>
            );
        } else if (part) {
            segments.push(part);
        }
    });
    return <>{segments}</>;
}

export default function ProblemChatAIPage() {
    const dispatch = useDispatch();
    const { problem } = useSelector((state: RootState) => state.problem);
    
    const messages = useSelector((state: RootState) => 
        problem?._id ? state.chat[problem._id] || [] : []
    );
    
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState<{ content: string; displayedLength: number } | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, streamingMessage]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Typewriter effect: reveal streaming message character-by-character
    useEffect(() => {
        if (!streamingMessage || streamingMessage.displayedLength >= streamingMessage.content.length) {
            if (streamingMessage && streamingMessage.displayedLength >= streamingMessage.content.length) {
                dispatch(addMessage({
                    problemId: problem!._id,
                    message: {
                        role: 'assistant',
                        content: streamingMessage.content,
                        timestamp: new Date().toISOString()
                    }
                }));
                setStreamingMessage(null);
            }
            return;
        }
        const chunkSize = 2;
        const delayMs = 18;
        const timer = setTimeout(() => {
            setStreamingMessage(prev => {
                if (!prev) return null;
                const next = Math.min(prev.displayedLength + chunkSize, prev.content.length);
                return { ...prev, displayedLength: next };
            });
        }, delayMs);
        return () => clearTimeout(timer);
    }, [streamingMessage, dispatch, problem?._id]);

    useEffect(() => {
        if (problem?._id && messages.length === 0) {
            loadChatHistory();
        }
    }, [problem?._id]);

    const loadChatHistory = async () => {
        try {
            const response = await axiosClient.get(
                `/api/chat/problem/${problem?._id}/history`
            );
            if (response.data.success && response.data.data.messages) {
                dispatch(setMessages({
                    problemId: problem?._id ?? '',
                    messages: response.data.data.messages
                }));
            }
        } catch (err) {
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!input.trim() || loading) return;
        
        if (!problem?._id) {
            setError('Problem not loaded. Please refresh the page.');
            return;
        }

        const userMessage: Message = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString()
        };

        dispatch(addMessage({
            problemId: problem._id,
            message: userMessage
        }));
        
        setInput('');
        setLoading(true);
        setIsTyping(true);
        setError(null);

        try {
            const response = await axiosClient.post<ChatResponse>(
                `/api/chat/problem/${problem._id}`,
                {
                    message: userMessage.content,
                    conversationHistory: messages
                }
            );

            setIsTyping(false);
            if (response.data.success) {
                const fullResponse = response.data.data.response;
                setStreamingMessage({ content: fullResponse, displayedLength: 0 });
            } else {
                setError('Failed to get response from AI');
            }
        } catch (error) {
            setIsTyping(false);

            const err = error as AxiosError<{ message?: string }>;

            const status = err.response?.status;

            if (status === 429) {
                setError("Too many requests. Please wait a moment.");
            } else if (status === 404) {
                setError("Problem not found.");
            } else {
                setError("Failed to send message. Please try again.");
            }
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e as React.FormEvent);
        }
    };

    const quickReplies = [
        "💡 Give me a hint",
        "⏱️ What's the time complexity?",
        "🔍 Explain the approach",
        "💻 Show me the solution"
    ];

    const handleQuickReply = (reply: string) => {
        setInput(reply.substring(2).trim());
        inputRef.current?.focus();
    };

    if (!problem) {
        return (
            <Loader
                fullPage
                message="Loading problem"
                submessage="Preparing AI assistant..."
            />
        );
    }

    return (
        <div className="flex flex-col h-full bg-primary">
            {/* Header */}
            <div className="card border-b border-primary shadow-md rounded-none bg-elevated">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-primary"></div>
                        </div>

                        <div className="flex-1">
                            <h2 className="text-primary font-semibold text-lg">AI Assistant</h2>
                            <p className="text-secondary text-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-success rounded-full"></span>
                                Online • Helping with {problem.title}
                            </p>
                        </div>

                        <div className={`px-4 py-2 rounded-full text-xs font-semibold ${
                            problem.difficulty === 'easy' ? 'bg-success-light text-success border border-success' :
                            problem.difficulty === 'medium' ? 'bg-warning-light text-warning border border-warning' :
                            'bg-error-light text-error border border-error'
                        }`}>
                            {problem.difficulty.toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 py-6 bg-secondary">
                <div className="max-w-4xl mx-auto space-y-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-8 py-12">
                            <div className="w-32 h-32 rounded-full bg-brand flex items-center justify-center shadow-xl animate-fade-in">
                                <svg className="w-16 h-16 text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>

                            <div className="text-center space-y-4">
                                <h3 className="text-2xl font-bold text-primary">👋 Welcome to AI Assistant!</h3>
                                <p className="text-secondary max-w-md">
                                    I&apos;m here to help you master this problem. Ask me anything!
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                                {[
                                    { icon: "💡", title: "Smart Hints", desc: "Progressive problem-solving hints" },
                                    { icon: "⏱️", title: "Complexity Analysis", desc: "Time & space complexity breakdown" },
                                    { icon: "🎯", title: "Best Approaches", desc: "Optimal solution strategies" },
                                    { icon: "🐛", title: "Debug Help", desc: "Find and fix code issues" }
                                ].map((feature, idx) => (
                                    <div key={idx} className="card hover:shadow-lg interactive">
                                        <div className="text-3xl mb-2">{feature.icon}</div>
                                        <h4 className="text-primary font-semibold text-sm mb-1">{feature.title}</h4>
                                        <p className="text-secondary text-xs">{feature.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <svg className="w-4 h-4 text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                )}

                                <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    {message.role === 'assistant' ? (
                                        <div className="w-full">
                                            {parseMessageContent(message.content).map((part, idx) => (
                                                part.type === 'code' ? (
                                                    <CodeBlock key={idx} code={part.content} language={part.language || 'text'} />
                                                ) : (
                                                    <div key={idx} className="bg-elevated border border-border-primary rounded-xl px-5 py-3 shadow-sm mb-3">
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-primary">
                                                            <MarkdownText text={part.content} />
                                                        </p>
                                                    </div>
                                                )
                                            ))}
                                            <p className="text-xs text-tertiary mt-1 px-2">
                                                {typeof message.timestamp === 'string' && message.timestamp
                                                    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : 'Just now'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="bg-brand text-inverse rounded-xl px-5 py-3 shadow-sm">
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                    {message.content}
                                                </p>
                                            </div>
                                            <p className="text-xs text-tertiary mt-1 px-2 text-right">
                                                {typeof message.timestamp === 'string' && message.timestamp
                                                    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : 'Just now'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {message.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <svg className="w-4 h-4 text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {/* Streaming AI response (typewriter effect) */}
                    {streamingMessage && (
                        <div className="flex items-start gap-3 animate-fade-in">
                            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center flex-shrink-0 shadow-sm">
                                <svg className="w-4 h-4 text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div className="flex-1 max-w-[85%]">
                                <div className="w-full">
                                    {(() => {
                                        const streamedContent = streamingMessage.content.slice(0, streamingMessage.displayedLength);
                                        const parts = parseMessageContent(streamedContent);
                                        const isStreaming = streamingMessage.displayedLength < streamingMessage.content.length;
                                        const lastIsText = parts.length > 0 && parts[parts.length - 1].type === 'text';
                                        return (
                                            <>
                                                {parts.map((part, idx) => (
                                                    part.type === 'code' ? (
                                                        <CodeBlock key={idx} code={part.content} language={part.language || 'text'} />
                                                    ) : (
                                                        <div key={idx} className="bg-elevated border border-border-primary rounded-xl px-5 py-3 shadow-sm mb-3">
                                                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-primary">
                                                                <MarkdownText text={part.content} />
                                                                {isStreaming && idx === parts.length - 1 && (
                                                                    <span className="inline-block w-2 h-4 ml-0.5 align-middle bg-brand animate-pulse rounded-sm" aria-hidden />
                                                                )}
                                                            </p>
                                                        </div>
                                                    )
                                                ))}
                                                {isStreaming && !lastIsText && parts.length > 0 && (
                                                    <div className="bg-elevated border border-border-primary rounded-xl px-5 py-2 shadow-sm mb-3">
                                                        <span className="inline-block w-2 h-4 bg-brand animate-pulse rounded-sm" aria-hidden />
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}

                    {isTyping && !streamingMessage && (
                        <div className="flex items-end gap-3 animate-fade-in">
                            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center shadow-sm">
                                <svg className="w-4 h-4 text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div className="bg-elevated border border-primary rounded-xl px-5 py-4 flex gap-1">
                                <span className="w-2 h-2 bg-brand rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                <span className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex justify-center animate-fade-in">
                            <div className="bg-error-light border border-error rounded-xl px-5 py-3 flex items-center gap-3 max-w-md">
                                <svg className="w-5 h-5 text-error flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-error text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {messages.length === 0 && (
                <div className="px-4 pb-3 bg-secondary">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {quickReplies.map((reply, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleQuickReply(reply)}
                                    className="btn-secondary text-sm whitespace-nowrap flex-shrink-0"
                                >
                                    {reply}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="bg-elevated border-t border-primary shadow-lg">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <form onSubmit={sendMessage} className="relative">
                        <div className="flex items-end gap-3">
                            <div className="flex-1">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask me anything about this problem..."
                                    disabled={loading}
                                    rows={1}
                                    className="input"
                                    style={{ minHeight: '56px', maxHeight: '128px' }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className={`btn-primary h-14 w-14 rounded-xl flex items-center justify-center ${
                                    loading || !input.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                                }`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-inverse border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-6 h-6 text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                )}
                            </button>
                        </div>

                       
                    </form>
                </div>
            </div>
        </div>
    );
}
