// app/problem/[slug]/editorial/page.tsx
"use client";
import { useSelector } from "react-redux";
import React, { useEffect, useState } from "react";
import type { RootState } from "@/app/store/store";
import { axiosClient } from "@/app/utils/axiosClient";
import Editorial from "./VideoPlayer";
import { AxiosError } from "axios";
import Loader from "@/app/components/TruckLoader";

interface EditorialContent {
  textContent: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  videoDuration?: number;
}

interface EditorialData {
  problemId: string;
  title: string;
  slug: string;
  editorialContent: EditorialContent;
}

export default function ProblemEditorialPage() {
  const { problem } = useSelector((state: RootState) => state.problem);
  const [editorialData, setEditorialData] = useState<EditorialData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEditorial = async () => {
      if (!problem?._id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await axiosClient.get(
          `/api/user/problem/${problem._id}/editorial`
        );

        if (response.data.success) {
          setEditorialData(response.data.data);
        } else {
          setError(response.data.message || "Failed to load editorial");
        }
      } catch (error) {
        const err = error as AxiosError<{ message?: string }>;


        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load editorial content"
        );
      } finally {
        setLoading(false);
      }
    };

    if (problem?._id) {
      fetchEditorial();
    }
  }, [problem?._id]);

  // Loading state
  if (loading) {
    return (
      <Loader
        fullPage
        message="Loading editorial"
        submessage="Fetching editorial content..."
      />
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-primary">
        <div className="card max-w-md w-full text-center">
          <div className="text-5xl mb-4 text-error-500">⚠️</div>
          <h2 className="text-2xl font-bold mb-2 text-primary">
            Error Loading Editorial
          </h2>
          <p className="mb-6 text-secondary">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary w-full"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No editorial content
  if (!editorialData?.editorialContent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-primary">
        <div className="card max-w-md w-full text-center">
          <div className="text-5xl mb-4 text-tertiary">📝</div>
          <h2 className="text-2xl font-bold mb-2 text-primary">
            No Editorial Available
          </h2>
          <p className="text-secondary">
            Editorial content for this problem is not available yet.
          </p>
        </div>
      </div>
    );
  }

  const { editorialContent } = editorialData;
  const hasTextContent =
    editorialContent.textContent && editorialContent.textContent.trim() !== "";

  return (
    <div className="min-h-screen py-8 px-4 bg-primary">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Video Player */}
        <Editorial
          secureUrl={editorialContent.videoUrl}
          thumbnailUrl={editorialContent.thumbnailUrl}
          duration={editorialContent.videoDuration || 0}
        />

        {/* Text Content with Embedded Styles */}
        {hasTextContent && (
          <div className="card animate-fade-in">
            <div
              dangerouslySetInnerHTML={{
                __html: `
                  <style>
                    .editorial-wrapper h1,
                    .editorial-wrapper h2,
                    .editorial-wrapper h3,
                    .editorial-wrapper h4,
                    .editorial-wrapper h5,
                    .editorial-wrapper h6 {
                      color: var(--text-primary);
                      font-weight: 700;
                      line-height: 1.3;
                      margin-top: 2rem;
                      margin-bottom: 1rem;
                    }

                    .editorial-wrapper h1 {
                      font-size: 2.25rem;
                      margin-top: 0;
                    }

                    .editorial-wrapper h2 {
                      font-size: 1.875rem;
                      padding-bottom: 0.5rem;
                      border-bottom: 2px solid var(--border-primary);
                    }

                    .editorial-wrapper h3 {
                      font-size: 1.5rem;
                    }

                    .editorial-wrapper h4 {
                      font-size: 1.25rem;
                    }

                    .editorial-wrapper p {
                      color: var(--text-secondary);
                      line-height: 1.75;
                      margin-bottom: 1rem;
                      font-size: 1rem;
                    }

                    .editorial-wrapper ul,
                    .editorial-wrapper ol {
                      color: var(--text-secondary);
                      margin: 1rem 0;
                      padding-left: 2rem;
                    }

                    .editorial-wrapper ul {
                      list-style-type: disc;
                    }

                    .editorial-wrapper ol {
                      list-style-type: decimal;
                    }

                    .editorial-wrapper li {
                      margin: 0.5rem 0;
                      line-height: 1.75;
                      padding-left: 0.25rem;
                    }

                    .editorial-wrapper li::marker {
                      color: var(--primary-500);
                      font-weight: 600;
                    }

                    .editorial-wrapper a {
                      color: var(--primary-500);
                      text-decoration: none;
                      font-weight: 500;
                      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                      border-bottom: 1px solid transparent;
                    }

                    .editorial-wrapper a:hover {
                      color: var(--primary-600);
                      border-bottom-color: var(--primary-500);
                    }

                    .editorial-wrapper code {
                      color: var(--primary-600);
                      background-color: var(--bg-secondary);
                      padding: 0.125rem 0.375rem;
                      border-radius: var(--radius-sm);
                      font-size: 0.875em;
                      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
                      border: 1px solid var(--border-primary);
                      font-weight: 500;
                    }

                    .editorial-wrapper pre {
                      background-color: var(--bg-secondary);
                      border: 1px solid var(--border-primary);
                      border-radius: var(--radius-lg);
                      padding: 1.25rem;
                      overflow-x: auto;
                      margin: 1.5rem 0;
                      box-shadow: var(--shadow-sm);
                    }

                    .editorial-wrapper pre code {
                      background: none;
                      color: var(--text-primary);
                      padding: 0;
                      border: none;
                      font-size: 0.875rem;
                      line-height: 1.6;
                      display: block;
                    }

                    .editorial-wrapper strong {
                      color: var(--text-primary);
                      font-weight: 600;
                    }

                    .editorial-wrapper em {
                      font-style: italic;
                      color: var(--text-secondary);
                    }

                    .editorial-wrapper blockquote {
                      border-left: 4px solid var(--primary-500);
                      background-color: var(--bg-secondary);
                      padding: 1rem 1.25rem;
                      margin: 1.5rem 0;
                      border-radius: var(--radius-md);
                      font-style: italic;
                    }

                    .editorial-wrapper blockquote p {
                      margin: 0;
                      color: var(--text-secondary);
                    }

                    .editorial-wrapper hr {
                      border: none;
                      border-top: 2px solid var(--border-primary);
                      margin: 2rem 0;
                    }

                    .editorial-wrapper table {
                      width: 100%;
                      border-collapse: collapse;
                      margin: 1.5rem 0;
                      background-color: var(--bg-elevated);
                      border-radius: var(--radius-lg);
                      overflow: hidden;
                      box-shadow: var(--shadow-sm);
                    }

                    .editorial-wrapper thead {
                      background-color: var(--bg-secondary);
                    }

                    .editorial-wrapper th {
                      padding: 0.75rem 1rem;
                      text-align: left;
                      font-weight: 600;
                      color: var(--text-primary);
                      border-bottom: 2px solid var(--border-primary);
                    }

                    .editorial-wrapper td {
                      padding: 0.75rem 1rem;
                      color: var(--text-secondary);
                      border-bottom: 1px solid var(--border-primary);
                    }

                    .editorial-wrapper tr:last-child td {
                      border-bottom: none;
                    }

                    .editorial-wrapper tbody tr {
                      transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    }

                    .editorial-wrapper tbody tr:hover {
                      background-color: var(--bg-overlay);
                    }

                    .editorial-wrapper img {
                      max-width: 100%;
                      height: auto;
                      border-radius: var(--radius-lg);
                      margin: 1.5rem 0;
                      box-shadow: var(--shadow-md);
                    }

                    .editorial-wrapper > *:first-child {
                      margin-top: 0;
                    }

                    .editorial-wrapper > *:last-child {
                      margin-bottom: 0;
                    }

                    .editorial-wrapper ::selection {
                      background-color: var(--primary-500);
                      color: white;
                    }
                  </style>
                  <div class="editorial-wrapper">
                    ${editorialContent.textContent}
                  </div>
                `,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
