// app/profile/[username]/utils/RecentSubmissionsCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Code2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { axiosClient } from '@/app/utils/axiosClient';
import { AxiosError } from 'axios';
import { motion } from 'framer-motion';

interface Submission {
  _id: string;
  problemId: {
    _id: string;
    title: string;
    slug: string;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  language: string;
  status: string;
  runtime: number | null;
  memory: number | null;
  createdAt: string;
}

interface RecentSubmissionsCardProps {
  username: string;
}

export default function RecentSubmissionsCard({ username }: RecentSubmissionsCardProps) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/api/${username}/recent-submissions`);

        if (response.data.success) {
          setSubmissions(response.data.data || []);
        } else {
          setError(response.data.error || 'Failed to load submissions');
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ error: string }>;
        setError(
          axiosError.response?.data?.error ||
          axiosError.message ||
          "An error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchSubmissions();
    }
  }, [username]);

  // Get status badge configuration
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'accepted') {
      return {
        icon: <CheckCircle2 size={16} />,
        bgColor: 'var(--success-100)',
        textColor: 'var(--success-600)',
        borderColor: 'var(--success-500)',
        label: 'Accepted'
      };
    } else if (statusLower === 'wrong answer') {
      return {
        icon: <XCircle size={16} />,
        bgColor: 'var(--error-100)',
        textColor: 'var(--error-600)',
        borderColor: 'var(--error-500)',
        label: 'Wrong Answer'
      };
    } else if (statusLower === 'time limit exceeded') {
      return {
        icon: <Clock size={16} />,
        bgColor: 'var(--warning-100)',
        textColor: 'var(--warning-600)',
        borderColor: 'var(--warning-500)',
        label: 'TLE'
      };
    } else if (statusLower === 'runtime error') {
      return {
        icon: <AlertCircle size={16} />,
        bgColor: 'var(--accent-100)',
        textColor: 'var(--accent-600)',
        borderColor: 'var(--accent-500)',
        label: 'Runtime Error'
      };
    } else {
      return {
        icon: <AlertCircle size={16} />,
        bgColor: 'var(--gray-200)',
        textColor: 'var(--gray-600)',
        borderColor: 'var(--gray-400)',
        label: status
      };
    }
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'var(--success-500)';
      case 'medium':
        return 'var(--warning-500)';
      case 'hard':
        return 'var(--error-500)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle row click to navigate to problem
  const handleRowClick = (slug: string) => {
    router.push(`/problems/${slug}`);
  };

  if (loading) {
    return (
      <div className="rounded-lg p-6 bg-elevated shadow-lg space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="skeleton h-5 w-44 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
        </div>
        {/* Table header */}
        <div className="grid grid-cols-5 gap-4 pb-2 border-b border-primary">
          {['w-24','w-16','w-20','w-16','w-14'].map((w, i) => (
            <div key={i} className={`skeleton h-3 ${w} rounded`} />
          ))}
        </div>
        {/* 7 submission rows */}
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 items-center py-1">
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-5 w-14 rounded-full" />
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-4 w-16 rounded" />
            <div className="skeleton h-4 w-12 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="rounded-lg p-6"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
      >
        <h2 
          className="text-xl font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Recent Submissions
        </h2>
        <p style={{ color: 'var(--error-500)' }}>{error}</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="rounded-lg p-6 shadow-lg"
      style={{ backgroundColor: 'var(--bg-elevated)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 
          className="text-xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Recent Submissions
        </h2>
        <span 
          className="text-sm"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Last 10 submissions
        </span>
      </motion.div>

      {/* Submissions Table */}
      {submissions.length === 0 ? (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Code2 size={32} style={{ color: 'var(--text-tertiary)' }} />
          </motion.div>
          <p style={{ color: 'var(--text-secondary)' }}>
            No submissions yet
          </p>
          <p 
            className="text-sm mt-2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Start solving problems to see your submission history!
          </p>
        </motion.div>
      ) : (
        <motion.div 
          className="overflow-x-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <table className="w-full">
            <thead>
              <tr 
                className="border-b"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <th 
                  className="text-left text-sm font-semibold pb-3 pr-4"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Problem
                </th>
                <th 
                  className="text-left text-sm font-semibold pb-3 pr-4"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Status
                </th>
                <th 
                  className="text-left text-sm font-semibold pb-3 pr-4"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Language
                </th>
                <th 
                  className="text-left text-sm font-semibold pb-3 pr-4"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Runtime
                </th>
                <th 
                  className="text-left text-sm font-semibold pb-3 pr-4"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Memory
                </th>
                <th 
                  className="text-left text-sm font-semibold pb-3"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission, index) => {
                const statusBadge = getStatusBadge(submission.status);
                
                return (
                  <motion.tr
                    key={submission._id}
                    onClick={() => handleRowClick(submission.problemId?.slug)}
                    className="border-b cursor-pointer transition-all duration-200"
                    style={{ 
                      borderColor: 'var(--border-primary)',
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ 
                      backgroundColor: 'var(--bg-secondary)',
                      scale: 1.01
                    }}
                  >
                    {/* Problem Title & Difficulty */}
                    <td className="py-4 pr-4">
                      <div className="flex flex-col">
                        <span 
                          className="font-medium transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {submission.problemId?.title || 'Unknown Problem'}
                        </span>
                        <span
                          className="text-xs font-semibold capitalize"
                          style={{ 
                            color: getDifficultyColor(submission.problemId?.difficulty || 'medium')
                          }}
                        >
                          {submission.problemId?.difficulty || 'Unknown'}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 pr-4">
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
                        style={{
                          backgroundColor: statusBadge.bgColor,
                          color: statusBadge.textColor,
                          borderColor: statusBadge.borderColor
                        }}
                      >
                        {statusBadge.icon}
                        <span className="text-xs font-medium">
                          {statusBadge.label}
                        </span>
                      </div>
                    </td>

                    {/* Language */}
                    <td className="py-4 pr-4">
                      <span 
                        className="text-sm capitalize"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {submission.language}
                      </span>
                    </td>

                    {/* Runtime */}
                    <td className="py-4 pr-4">
                      <span 
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {submission.runtime !== null
                          ? `${submission.runtime} ms`
                          : '-'}
                      </span>
                    </td>

                    {/* Memory */}
                    <td className="py-4 pr-4">
                      <span 
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {submission.memory !== null
                          ? `${(submission.memory / 1024).toFixed(2)} MB`
                          : '-'}
                      </span>
                    </td>

                    {/* Time Ago */}
                    <td className="py-4">
                      <span 
                        className="text-sm"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {formatTimeAgo(submission.createdAt)}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}
    </motion.div>
  );
}
