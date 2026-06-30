'use client'

import { useState } from 'react';
import { discussionApi, handleApiError, Discussion } from './discussionApi';

interface DiscussionFormProps {
    problemId: string;
    // For editing existing discussion
    existingDiscussion?: {
        _id: string;
        title: string;
        content: string;
        type: string;
        tags?: string[];
    };
    // Callbacks
    onSuccess: (discussion: Discussion) => void;
    onCancel: () => void;
    // Optional styling
    className?: string;
}

interface FormData {
    content: string;
    tags: string[];
}

interface FormErrors {
    content?: string;
    general?: string;
}

// Derive a short title from the message content so the backend (which still
// stores a title) doesn't need a separate field from the user.
function deriveTitle(content: string): string {
    const trimmed = content.trim().replace(/\s+/g, ' ');
    return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
}

export default function DiscussionForm({
    problemId,
    existingDiscussion,
    onSuccess,
    onCancel,
    className = ''
}: DiscussionFormProps) {
    const [formData, setFormData] = useState<FormData>({
        content: existingDiscussion?.content || '',
        tags: existingDiscussion?.tags || []
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [isAnimatingSuccess, setIsAnimatingSuccess] = useState(false);

    const isEditing = !!existingDiscussion;
    // Type is always "general" for user-created discussions — no picker needed.
    const discussionType = existingDiscussion?.type || 'general';

    // Validation
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.content.trim()) {
            newErrors.content = 'Please write a message';
        } else if (formData.content.trim().length < 10) {
            newErrors.content = 'Message must be at least 10 characters';
        } else if (formData.content.trim().length > 5000) {
            newErrors.content = 'Message must be less than 5000 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            const content = formData.content.trim();
            const submitData = {
                title: deriveTitle(content),
                content,
                type: discussionType,
                tags: formData.tags.filter(tag => tag.trim().length > 0)
            };

            let response;

            if (isEditing) {
                response = await discussionApi.updateDiscussion(existingDiscussion._id, submitData);
            } else {
                response = await discussionApi.createDiscussion({
                    problemId,
                    ...submitData
                });
            }

            if (response.success) {
                // Trigger success animation
                setIsAnimatingSuccess(true);

                // Wait for animation before calling success callback
                setTimeout(() => {
                    onSuccess(response.discussion);
                    // Reset form if creating new
                    if (!isEditing) {
                        setFormData({ content: '', tags: [] });
                    }
                }, 600);
            }
        } catch (error) {
            const errorMessage = handleApiError(error);
            setErrors({ general: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle input changes
    const handleContentChange = (value: string) => {
        setFormData(prev => ({ ...prev, content: value }));
        if (errors.content) {
            setErrors(prev => ({ ...prev, content: undefined }));
        }
    };

    // Handle tag management
    const addTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tag]
            }));
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    return (
        <div className={`relative ${className}`}>
            {/* Success Animation Overlay */}
            {isAnimatingSuccess && (
                <div
                    className="absolute inset-0 z-50 flex items-center justify-center"
                    style={{
                        backgroundColor: 'var(--bg-modal)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: 'var(--radius-2xl)'
                    }}
                >
                    <div className="text-center animate-slide-up">
                        <div
                            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg"
                            style={{
                                background: 'linear-gradient(135deg, var(--success-500) 0%, var(--success-600) 100%)'
                            }}
                        >
                            <svg className="w-8 h-8 text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-primary mb-2">
                            {isEditing ? 'Discussion Updated!' : 'Discussion Posted!'}
                        </h3>
                        <p className="text-secondary">
                            {isEditing ? 'Your changes have been saved.' : 'Your message is now live.'}
                        </p>
                    </div>
                </div>
            )}

            <div className="card shadow-lg">
                {/* Header */}
                <div
                    className="px-8 py-6 -mx-6 -mt-6 mb-6"
                    style={{
                        background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%)',
                        borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0'
                    }}
                >
                    <div className="flex items-center space-x-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <svg className="w-6 h-6 text-inverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-inverse">
                                {isEditing ? 'Edit Message' : 'Start a Discussion'}
                            </h3>
                            <p className="text-inverse opacity-90 text-sm mt-1">
                                {isEditing ? 'Update your message' : 'Just write your message — that\'s it.'}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* General Error */}
                    {errors.general && (
                        <div
                            className="p-4 rounded-xl text-sm flex items-center space-x-3 animate-fade-in"
                            style={{
                                backgroundColor: 'var(--error-50)',
                                borderColor: 'var(--error-500)',
                                color: 'var(--error-600)',
                                border: '1px solid'
                            }}
                        >
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: 'var(--error-100)' }}
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-medium">Error</h4>
                                <p>{errors.general}</p>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="space-y-2">
                        <label htmlFor="content" className="flex items-center space-x-2 text-sm font-semibold text-secondary">
                            <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Your Message *</span>
                        </label>
                        <div className="relative">
                            <textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => handleContentChange(e.target.value)}
                                placeholder="Ask a question, share an approach, or say something helpful..."
                                rows={6}
                                className="input resize-none"
                                style={{
                                    ...(errors.content && {
                                        borderColor: 'var(--error-500)',
                                        backgroundColor: 'var(--error-50)'
                                    })
                                }}
                                maxLength={5000}
                                autoFocus
                            />
                            <div
                                className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded-full shadow-xs"
                                style={{
                                    color: 'var(--text-muted)',
                                    backgroundColor: 'var(--bg-primary)'
                                }}
                            >
                                {formData.content.length}/5000
                            </div>
                        </div>
                        {errors.content && (
                            <p className="text-xs flex items-center space-x-1" style={{ color: 'var(--error-600)' }}>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span>{errors.content}</span>
                            </p>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <label htmlFor="tags" className="flex items-center space-x-2 text-sm font-semibold text-secondary">
                            <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span>Tags (Optional)</span>
                        </label>
                        <div className="flex gap-2 mb-3">
                            <input
                                id="tags"
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={handleTagInputKeyPress}
                                placeholder="Add a tag..."
                                className="input flex-1"
                                maxLength={20}
                            />
                            <button
                                type="button"
                                onClick={addTag}
                                disabled={!tagInput.trim() || formData.tags.length >= 5}
                                className="btn-primary"
                                style={{
                                    ...((!tagInput.trim() || formData.tags.length >= 5) && {
                                        backgroundColor: 'var(--gray-300)',
                                        color: 'var(--text-muted)',
                                        cursor: 'not-allowed'
                                    })
                                }}
                            >
                                Add
                            </button>
                        </div>

                        {/* Tag Display */}
                        {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {formData.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1.5 text-sm rounded-full font-medium animate-fade-in"
                                        style={{
                                            backgroundColor: 'var(--primary-100)',
                                            color: 'var(--primary-800)'
                                        }}
                                    >
                                        #{tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="ml-2 transition-colors"
                                            style={{ color: 'var(--primary-600)' }}
                                        >
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <p className="text-xs flex items-center space-x-1" style={{ color: 'var(--text-muted)' }}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>{formData.tags.length}/5 tags. Press Enter or click Add to add a tag.</span>
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.content.trim()}
                            className="flex-1 px-6 py-3 rounded-xl font-semibold shadow-sm transition-all duration-200"
                            style={{
                                background: (!isSubmitting && formData.content.trim())
                                    ? 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%)'
                                    : 'var(--gray-300)',
                                color: (!isSubmitting && formData.content.trim())
                                    ? 'var(--text-inverse)'
                                    : 'var(--text-muted)',
                                cursor: (!isSubmitting && formData.content.trim())
                                    ? 'pointer'
                                    : 'not-allowed'
                            }}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
                                    <span>{isEditing ? 'Updating...' : 'Posting...'}</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    <span>{isEditing ? 'Update Message' : 'Post Message'}</span>
                                </div>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="btn-secondary"
                            style={{
                                ...(isSubmitting && {
                                    opacity: '0.5',
                                    cursor: 'not-allowed'
                                })
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
