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

function CodeBlock({ code, language }: { code: string; language: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (_) {}
    };

    return (
        <div className="relative my-3 rounded-xl overflow-hidden shadow-lg border border-gray-700" style={{ backgroundColor: '#1e1e1e' }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700" style={{ backgroundColor: '#2d2d30' }}>
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 capitalize tracking-wide">
                        {language || 'code'}
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-md transition-all duration-200 font-medium"
                    style={{
                        backgroundColor: copied ? '#10b981' : '#3b3b3b',
                        color: copied ? '#ffffff' : '#d4d4d4',
                    }}
                >
                    {copied ? (
                        <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                        </>
                    ) : (
                        <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                        </>
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                language={language || 'javascript'}
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                    padding: '1rem 1.25rem',
                    backgroundColor: '#1e1e1e',
                    fontSize: '0.8125rem',
                    lineHeight: '1.65',
                    fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
                }}
                showLineNumbers
                wrapLines
                lineNumberStyle={{
                    minWidth: '3em',
                    paddingRight: '1.25em',
                    color: '#555',
                    textAlign: 'right',
                    userSelect: 'none',
                    borderRight: '1px solid #3e3e42',
                    marginRight: '1em',
                }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
}

// Inline markdown: **bold**, `code`, *italic*
function MarkdownInline({ text }: { text: string }) {
    const segments: React.ReactNode[] = [];
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/);
    parts.forEach((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            segments.push(<strong key={i} className="font-semibold text-primary">{part.slice(2, -2)}</strong>);
        } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
            segments.push(<em key={i} className="italic text-secondary">{part.slice(1, -1)}</em>);
        } else if (part.startsWith('`') && part.endsWith('`')) {
            segments.push(
                <code key={i} className="px-1.5 py-0.5 rounded text-xs font-mono bg-secondary border border-border-primary text-brand">
                    {part.slice(1, -1)}
                </code>
            );
        } else if (part) {
            segments.push(part);
        }
    });
    return <>{segments}</>;
}

// Full markdown block renderer: headers, lists, blockquotes, paragraphs
function MarkdownRenderer({ content, streaming }: { content: string; streaming?: boolean }) {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (!line.trim()) { i++; continue; }

        // Headings
        if (line.startsWith('### ')) {
            elements.push(
                <h3 key={i} className="text-sm font-bold text-primary mt-3 mb-1 leading-snug">
                    <MarkdownInline text={line.slice(4)} />
                </h3>
            );
            i++; continue;
        }
        if (line.startsWith('## ')) {
            elements.push(
                <h2 key={i} className="text-base font-bold text-primary mt-4 mb-1 leading-snug">
                    <MarkdownInline text={line.slice(3)} />
                </h2>
            );
            i++; continue;
        }
        if (line.startsWith('# ')) {
            elements.push(
                <h1 key={i} className="text-lg font-bold text-primary mt-4 mb-2 leading-snug">
                    <MarkdownInline text={line.slice(2)} />
                </h1>
            );
            i++; continue;
        }

        // Unordered list — collect consecutive items
        if (line.startsWith('- ') || line.startsWith('* ')) {
            const items: string[] = [];
            while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
                items.push(lines[i].slice(2));
                i++;
            }
            elements.push(
                <ul key={`ul-${i}`} className="list-disc list-outside ml-4 space-y-1 my-2">
                    {items.map((item, idx) => (
                        <li key={idx} className="text-sm text-primary leading-relaxed">
                            <MarkdownInline text={item} />
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // Ordered list
        if (/^\d+\.\s/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                items.push(lines[i].replace(/^\d+\.\s/, ''));
                i++;
            }
            elements.push(
                <ol key={`ol-${i}`} className="list-decimal list-outside ml-4 space-y-1 my-2">
                    {items.map((item, idx) => (
                        <li key={idx} className="text-sm text-primary leading-relaxed">
                            <MarkdownInline text={item} />
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        // Blockquote
        if (line.startsWith('> ')) {
            elements.push(
                <blockquote key={i} className="border-l-4 border-brand pl-3 my-2 text-secondary italic text-sm">
                    <MarkdownInline text={line.slice(2)} />
                </blockquote>
            );
            i++; continue;
        }

        // Horizontal rule
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
            elements.push(<hr key={i} className="border-border-primary my-3" />);
            i++; continue;
        }

        // Regular paragraph
        const isLast = i === lines.length - 1;
        elements.push(
            <p key={i} className="text-sm leading-relaxed text-primary">
                <MarkdownInline text={line} />
                {streaming && isLast && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-brand animate-pulse rounded-sm" aria-hidden />
                )}
            </p>
        );
        i++;
    }

    return <div className="space-y-1">{elements}</div>;
}

function parseMessageContent(content: string) {
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            const textContent = content.slice(lastIndex, match.index).trim();
            if (textContent) parts.push({ type: 'text', content: textContent });
        }
        parts.push({
            type: 'code',
            content: match[2].trim(),
            language: (match[1] || 'text').toLowerCase(),
        });
        lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < content.length) {
        const remaining = content.slice(lastIndex).trim();
        if (remaining) parts.push({ type: 'text', content: remaining });
    }

    return parts.length > 0 ? parts : [{ type: 'text' as const, content }];
}

const EMPTY_MESSAGES: Message[] = [];

const QUICK_REPLIES = [
    { label: "💡 Give me a hint", icon: "💡" },
    { label: "⏱️ Time complexity?", icon: "⏱️" },
    { label: "🔍 Explain the approach", icon: "🔍" },
    { label: "💻 Show the solution", icon: "💻" },
];

export default function ProblemChatAIPage() {
    const dispatch = useDispatch();
    const { problem } = useSelector((state: RootState) => state.problem);
    const { user } = useSelector((state: RootState) => state.auth);

    const messages = useSelector((state: RootState) =>
        problem?._id ? state.chat[problem._id] ?? EMPTY_MESSAGES : EMPTY_MESSAGES
    );

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    // Purely cosmetic reveal-in-progress state. The message itself is already
    // committed to Redux (see sendMessage) as soon as the response arrives, so
    // losing/overwriting this state can never lose or misorder a reply — it
    // only cuts a reveal animation short.
    const [typewriter, setTypewriter] = useState<{ key: string; content: string; length: number } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(() => { scrollToBottom(); }, [messages, isTyping, typewriter]);
    useEffect(() => { inputRef.current?.focus(); }, []);

    // Auto-resize textarea
    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
    }, [input]);

    // Typewriter reveal effect — advances displayed length only, no dispatch
    useEffect(() => {
        if (!typewriter || typewriter.length >= typewriter.content.length) return;
        const timer = setTimeout(() => {
            setTypewriter(prev => {
                if (!prev) return null;
                return { ...prev, length: Math.min(prev.length + 3, prev.content.length) };
            });
        }, 12);
        return () => clearTimeout(timer);
    }, [typewriter]);

    useEffect(() => {
        if (problem?._id && messages.length === 0) loadChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [problem?._id]);

    const loadChatHistory = async () => {
        try {
            const response = await axiosClient.get(`/api/chat/problem/${problem?._id}/history`);
            if (response.data.success && response.data.data.messages) {
                dispatch(setMessages({ problemId: problem?._id ?? '', messages: response.data.data.messages }));
            }
        } catch (_) {}
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;
        if (!problem?._id) {
            setError('Problem not loaded. Please refresh.');
            return;
        }
        // Captured now so a later navigation to a different problem can't
        // misattribute this reply once the response comes back.
        const problemId = problem._id;

        const userMessage: Message = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString(),
        };

        dispatch(addMessage({ problemId, message: userMessage }));
        setInput('');
        setLoading(true);
        setIsTyping(true);
        setError(null);

        try {
            const response = await axiosClient.post<ChatResponse>(
                `/api/chat/problem/${problemId}`,
                { message: userMessage.content, conversationHistory: messages }
            );
            setIsTyping(false);
            if (response.data.success) {
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: response.data.data.response,
                    timestamp: new Date().toISOString(),
                };
                // Commit immediately — a reveal animation is cosmetic and must
                // never gate whether/when the reply lands in history.
                dispatch(addMessage({ problemId, message: assistantMessage }));
                setTypewriter({ key: assistantMessage.timestamp, content: assistantMessage.content, length: 0 });
            } else {
                setError('Failed to get a response. Please try again.');
            }
        } catch (err) {
            setIsTyping(false);
            const axErr = err as AxiosError<{ error?: string }>;
            const status = axErr.response?.status;
            const msg = axErr.response?.data?.error;
            if (status === 429) setError(msg || 'Too many requests — please wait a moment.');
            else if (status === 503) setError(msg || 'AI service is temporarily unavailable.');
            else if (status === 404) setError('Problem not found.');
            else setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e as unknown as React.FormEvent);
        }
    };

    const formatTime = (ts: string) => {
        try {
            return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    if (!problem) {
        return <Loader fullPage message="Loading problem" submessage="Preparing AI assistant..." />;
    }

    const difficultyStyle =
        problem.difficulty === 'easy'
            ? 'bg-success-light text-success border-success'
            : problem.difficulty === 'medium'
            ? 'bg-warning-light text-warning border-warning'
            : 'bg-error-light text-error border-error';

    return (
        <div className="flex flex-col h-full bg-primary">
            {/* ── Header ── */}
            <div className="border-b border-primary bg-elevated shadow-sm flex-shrink-0">
                <div className="max-w-3xl mx-auto px-5 py-3 flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center shadow">
                            <svg className="w-5 h-5 text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-primary font-semibold text-sm leading-tight">TrueCode AI</p>
                        <p className="text-tertiary text-xs truncate">Helping with: {problem.title}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${difficultyStyle}`}>
                        {problem.difficulty.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto bg-secondary">
                <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
                    {messages.length === 0 && !isTyping ? (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
                            <div className="w-20 h-20 rounded-full bg-brand/10 border-2 border-brand/30 flex items-center justify-center">
                                <svg className="w-9 h-9 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-primary mb-1">Ask me anything!</h3>
                                <p className="text-secondary text-sm max-w-xs">
                                    I&apos;ll guide you through <span className="font-medium text-primary">{problem.title}</span> without giving away the answer.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                                {[
                                    { icon: "💡", title: "Smart Hints", desc: "Progressive hints" },
                                    { icon: "⏱️", title: "Complexity", desc: "Time & space analysis" },
                                    { icon: "🎯", title: "Approach", desc: "Optimal strategies" },
                                    { icon: "🐛", title: "Debug Help", desc: "Find & fix issues" },
                                ].map((f, idx) => (
                                    <div key={idx} className="card p-3 text-left hover:shadow-md transition-shadow">
                                        <span className="text-2xl">{f.icon}</span>
                                        <p className="text-primary font-semibold text-xs mt-1.5 mb-0.5">{f.title}</p>
                                        <p className="text-tertiary text-xs">{f.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <div key={index} className={`flex gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar */}
                                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm mt-1 overflow-hidden ${
                                    message.role === 'assistant' ? 'bg-brand' : 'bg-accent'
                                }`}>
                                    {message.role === 'assistant' ? (
                                        <svg className="w-3.5 h-3.5 text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    ) : user?.profilePicture ? (
                                        <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <svg className="w-3.5 h-3.5 text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    )}
                                </div>

                                {/* Bubble */}
                                <div className={`flex flex-col max-w-[82%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    {message.role === 'assistant' ? (
                                        <div className="space-y-1.5">
                                            {(() => {
                                                const isRevealing = typewriter?.key === message.timestamp;
                                                const displayContent = isRevealing
                                                    ? typewriter!.content.slice(0, typewriter!.length)
                                                    : message.content;
                                                const isActive = isRevealing && typewriter!.length < typewriter!.content.length;
                                                const parts = parseMessageContent(displayContent);
                                                return parts.map((part, idx) =>
                                                    part.type === 'code' ? (
                                                        <CodeBlock key={idx} code={part.content} language={part.language || 'text'} />
                                                    ) : (
                                                        <div key={idx} className="bg-elevated border border-border-primary rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                                            <MarkdownRenderer
                                                                content={part.content}
                                                                streaming={isActive && idx === parts.length - 1}
                                                            />
                                                        </div>
                                                    )
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="bg-brand rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                                            <p className="text-sm leading-relaxed text-inverse whitespace-pre-wrap break-words">
                                                {message.content}
                                            </p>
                                        </div>
                                    )}
                                    <span className="text-xs text-tertiary mt-1 px-1">
                                        {formatTime(message.timestamp)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Typing indicator */}
                    {isTyping && (
                        <div className="flex gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-brand flex-shrink-0 flex items-center justify-center shadow-sm">
                                <svg className="w-3.5 h-3.5 text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div className="bg-elevated border border-border-primary rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                                <span className="w-2 h-2 bg-brand rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                <span className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex justify-center">
                            <div className="bg-error-light border border-error rounded-xl px-4 py-2.5 flex items-center gap-2 max-w-sm">
                                <svg className="w-4 h-4 text-error flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-error text-xs">{error}</p>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* ── Input Area ── */}
            <div className="bg-elevated border-t border-primary flex-shrink-0">
                <div className="max-w-3xl mx-auto px-4 pt-3 pb-2">
                    {/* Quick replies */}
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
                        {QUICK_REPLIES.map((qr, idx) => (
                            <button
                                key={idx}
                                onClick={() => { setInput(qr.label.slice(3).trim()); inputRef.current?.focus(); }}
                                disabled={loading}
                                className="btn-secondary text-xs whitespace-nowrap flex-shrink-0 py-1 px-3 disabled:opacity-40"
                            >
                                {qr.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={sendMessage} className="flex items-end gap-2">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about this problem… (Enter to send, Shift+Enter for newline)"
                            disabled={loading}
                            rows={1}
                            className="input flex-1 resize-none overflow-hidden"
                            style={{ minHeight: '44px', maxHeight: '128px' }}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="btn-primary h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-inverse border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg className="w-5 h-5 text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </form>
                    <p className="text-tertiary text-xs mt-1.5 text-center">
                        AI may make mistakes — verify important details
                    </p>
                </div>
            </div>
        </div>
    );
}
