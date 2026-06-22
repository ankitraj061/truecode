"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { axiosClient } from "@/app/utils/axiosClient";
import { AxiosError } from "axios";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { slug } = useParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "bug",
    message: "",
    problemSlug: typeof slug === "string" ? slug : "",
  });

  const feedbackTypes = [
    {
      value: "bug",
      label: "Bug Report",
      description: "Found something broken?",
      icon: "🐛",
      color: "error",
    },
    {
      value: "suggestion",
      label: "Feature Request",
      description: "Have an idea to improve?",
      icon: "💡",
      color: "primary",
    },
    {
      value: "question",
      label: "Question",
      description: "Need help with something?",
      icon: "❓",
      color: "accent",
    },
    {
      value: "other",
      label: "General",
      description: "Something else entirely",
      icon: "💬",
      color: "secondary",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const response = await axiosClient.post("/api/feedback", {
        type: formData.type,
        message: formData.message.trim(),
        problemSlug: formData.problemSlug || undefined,
      });

      if (response.data.success) {
        setSuccess(true);

        // Auto close after 2 seconds
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (error: unknown) {
      let errorMessage = "Failed to submit feedback";
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.error || errorMessage;
      }
      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setFormData({
      type: "bug",
      message: "",
      problemSlug: typeof slug === "string" ? slug : "",
    });
    setSubmitError(null);
    onClose();
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getTypeStyles = (isSelected: boolean) => {
    const baseStyles = `
      border-2 transition-all duration-200 cursor-pointer
      hover:shadow-md hover:transform hover:scale-[1.02]
    `;

    if (isSelected) {
      return baseStyles;
    }

    return `${baseStyles} border-primary hover:border-secondary hover:bg-secondary`;
  };

  const getTypeSelectedColors = (colorType: string) => {
    const colors: Record<string, { borderColor: string; backgroundColor: string }> = {
      error: { borderColor: "var(--error-500)", backgroundColor: "var(--error-50)" },
      primary: { borderColor: "var(--primary-500)", backgroundColor: "var(--primary-50)" },
      accent: { borderColor: "var(--accent-500)", backgroundColor: "var(--accent-50)" },
      secondary: { borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-tertiary)" },
    };
    return colors[colorType] || colors.secondary;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: "var(--bg-modal)" }}
    >
      <div
        className="glass rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-slide-up"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-primary)",
        }}
      >
        {/* Success State */}
        {success && (
          <div className="p-8 text-center">
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "var(--success-100)" }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: "var(--success-500)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Thanks for your feedback! 🎉
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Your message helps us make TrueCode better for everyone.
            </p>
          </div>
        )}

        {/* Form State */}
        {!success && (
          <>
            {/* Header */}
            <div
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <div>
                <h2
                  className="text-xl font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Share your feedback
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Help us improve your experience
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full transition-colors hover:bg-secondary"
                style={{ color: "var(--text-tertiary)" }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {submitError && (
                <div className="rounded-lg border border-error bg-error-light px-3 py-2 text-sm text-error">
                  {submitError}
                </div>
              )}
              {/* Feedback Type */}
              <div>
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  What&apos;s this about?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {feedbackTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleChange("type", type.value)}
                      className={`p-4 text-left rounded-xl ${getTypeStyles(
                        formData.type === type.value
                      )}`}
                      style={
                        formData.type === type.value
                          ? getTypeSelectedColors(type.color)
                          : undefined
                      }
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl flex-shrink-0">
                          {type.icon}
                        </span>
                        <div className="min-w-0">
                          <div
                            className="font-medium text-sm"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {type.label}
                          </div>
                          <div
                            className="text-xs mt-1"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {type.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Tell us more
                </label>
                <div className="relative">
                  <textarea
                    value={formData.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    rows={4}
                    maxLength={1000}
                    placeholder="Share your thoughts, describe the issue, or suggest improvements..."
                    className="input resize-none text-sm leading-relaxed"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      borderColor: "var(--border-primary)",
                      color: "var(--text-primary)",
                    }}
                    required
                  />
                  <div
                    className={`absolute bottom-3 right-3 text-xs transition-colors ${
                      formData.message.length > 900
                        ? "text-warning-500"
                        : formData.message.length > 950
                        ? "text-error-500"
                        : ""
                    }`}
                    style={{
                      color:
                        formData.message.length <= 900
                          ? "var(--text-muted)"
                          : undefined,
                    }}
                  >
                    {formData.message.length}/1000
                  </div>
                </div>
              </div>

              {/* Problem Context */}
              {formData.problemSlug && (
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    backgroundColor: "var(--primary-50)",
                    borderColor: "var(--primary-200)",
                  }}
                >
                  <div className="flex items-center space-x-2 text-sm">
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: "var(--primary-600)" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span style={{ color: "var(--primary-700)" }}>
                      <span className="font-medium">Related to problem:</span>{" "}
                      {formData.problemSlug}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.message.trim()}
                  className={`btn-primary flex-1 ${
                    loading || !formData.message.trim()
                      ? "opacity-50 cursor-not-allowed"
                      : "interactive"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div
                        className="animate-spin rounded-full h-4 w-4 border-b-2"
                        style={{ borderColor: "var(--text-inverse)" }}
                      ></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    "Send Feedback"
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
