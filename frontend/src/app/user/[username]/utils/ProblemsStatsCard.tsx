// app/profile/[username]/utils/ProblemsStatsCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { axiosClient } from '@/app/utils/axiosClient';
import { AxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface ProblemStats {
  easy: {
    solved: number;
    total: number;
  };
  medium: {
    solved: number;
    total: number;
  };
  hard: {
    solved: number;
    total: number;
  };
  overall: {
    totalSubmissions: number;
    acceptedSubmissions: number;
    acceptanceRate: number;
  };
}

interface ProblemsStatsCardProps {
  username: string;
}

export default function ProblemsStatsCard({ username }: ProblemsStatsCardProps) {
  const [stats, setStats] = useState<ProblemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<'overall' | 'easy' | 'medium' | 'hard' | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(
          `/api/${username}/problems-stats`
        );

        if (response.data.success) {
          setStats(response.data.data);
        } else {
          setError(response.data.error || 'Failed to load stats');
        }
      } catch (error) {
        const err = error as AxiosError<{ error?: string }>;
        setError(
          err.response?.data?.error || err.message || 'An error occurred'
        );
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchStats();
    }
  }, [username]);

  // Calculate total solved and total problems
  const getTotalStats = () => {
    if (!stats) return { solved: 0, total: 0, percentage: 0 };

    const solved = stats.easy.solved + stats.medium.solved + stats.hard.solved;
    const total = stats.easy.total + stats.medium.total + stats.hard.total;
    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

    return { solved, total, percentage };
  };

  // Calculate percentage for each difficulty
  const getPercentage = (solved: number, total: number): number => {
    return total > 0 ? Math.round((solved / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="rounded-lg p-6 bg-elevated shadow-lg space-y-5">
        {/* Title */}
        <div className="skeleton h-5 w-36 rounded" />
        {/* Big circle + total */}
        <div className="flex items-center justify-center">
          <div className="skeleton w-24 h-24 rounded-full" />
        </div>
        {/* 3 difficulty rows */}
        {[1,2,3].map(i => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <div className="skeleton h-3.5 w-14 rounded" />
              <div className="skeleton h-3.5 w-10 rounded" />
            </div>
            <div className="skeleton h-2 w-full rounded-full" />
          </div>
        ))}
        {/* Acceptance rate */}
        <div className="flex justify-between pt-2 border-t border-primary">
          <div className="skeleton h-3.5 w-28 rounded" />
          <div className="skeleton h-3.5 w-12 rounded" />
        </div>
      </div>
    );
  }
  if (error || !stats) {
    return (
      <div 
        className="rounded-lg p-6"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
      >
        <h2 
          className="text-xl font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Problems Solved
        </h2>
        <p style={{ color: 'var(--error-500)' }}>
          {error || 'Failed to load stats'}
        </p>
      </div>
    );
  }

  const totalStats = getTotalStats();

  // Calculate arc lengths for each difficulty section
  const easyPercentage = getPercentage(stats.easy.solved, stats.easy.total);
  const mediumPercentage = getPercentage(stats.medium.solved, stats.medium.total);
  const hardPercentage = getPercentage(stats.hard.solved, stats.hard.total);
  
  // Calculate the arc angles
  const easyAngle = (easyPercentage / 100) * 360;
  const mediumAngle = (mediumPercentage / 100) * 360;
  const hardAngle = (hardPercentage / 100) * 360;

  // Calculate cumulative angles
  const mediumStartAngle = easyAngle;
  const hardStartAngle = easyAngle + mediumAngle;

  return (
    <motion.div 
      className="rounded-lg p-6 shadow-lg border"
      style={{ 
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border-primary)'
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.h2 
          className="text-xl font-bold"
          style={{ color: 'var(--text-primary)' }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          Problems Solved
        </motion.h2>
        <motion.div 
          className="text-right"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {totalStats.solved}
            <span className="text-lg" style={{ color: 'var(--text-tertiary)' }}>
              /{totalStats.total}
            </span>
          </p>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Total
          </p>
        </motion.div>
      </div>

      {/* Main Content - Circular Progress + Difficulty Stats */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Circular Progress Indicator */}
        <motion.div 
          className="flex-1 flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div 
            className="relative w-40 h-40 cursor-pointer"
            onMouseEnter={() => setHoveredSection('overall')}
            onMouseLeave={() => setHoveredSection(null)}
          >
            {/* Background Circle */}
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="var(--bg-tertiary)"
                strokeWidth="8"
              />
            </svg>
            
            {/* Easy Progress Arc */}
            <motion.svg 
              className="absolute top-0 left-0 w-full h-full" 
              viewBox="0 0 100 100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="var(--success-500)"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                animate={{ 
                  strokeDashoffset: 2 * Math.PI * 45 * (1 - easyPercentage / 100),
                  opacity: hoveredSection === null || hoveredSection === 'easy' ? 1 : 0.3
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </motion.svg>
            
            {/* Medium Progress Arc */}
            <motion.svg 
              className="absolute top-0 left-0 w-full h-full" 
              viewBox="0 0 100 100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="var(--warning-500)"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeLinecap="round"
                transform={`rotate(-90 50 50) rotate(${easyAngle} 50 50)`}
                initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                animate={{ 
                  strokeDashoffset: 2 * Math.PI * 45 * (1 - mediumPercentage / 100),
                  opacity: hoveredSection === null || hoveredSection === 'medium' ? 1 : 0.3
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </motion.svg>
            
            {/* Hard Progress Arc */}
            <motion.svg 
              className="absolute top-0 left-0 w-full h-full" 
              viewBox="0 0 100 100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="var(--error-500)"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeLinecap="round"
                transform={`rotate(-90 50 50) rotate(${hardStartAngle} 50 50)`}
                initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                animate={{ 
                  strokeDashoffset: 2 * Math.PI * 45 * (1 - hardPercentage / 100),
                  opacity: hoveredSection === null || hoveredSection === 'hard' ? 1 : 0.3
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </motion.svg>
            
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <AnimatePresence mode="wait">
                {hoveredSection === 'overall' ? (
                  <motion.div
                    key="acceptance"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-sm" style={{ color: 'var(--primary-500)' }}>
                      Acceptance Rate
                    </div>
                    <div className="text-3xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                      {stats.overall.acceptanceRate}%
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="solved"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {totalStats.solved}/{totalStats.total}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      Solved
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Total Submissions Info */}
          <motion.div 
            className="mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {stats.overall.totalSubmissions} Total Submissions
            </div>
          </motion.div>
        </motion.div>

        {/* Difficulty Stats */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Easy */}
          <motion.div 
            className="rounded-lg p-4 transition-all cursor-pointer"
            style={{
              backgroundColor: hoveredSection === 'easy' ? 'var(--bg-secondary)' : 'var(--bg-tertiary)'
            }}
            onMouseEnter={() => setHoveredSection('easy')}
            onMouseLeave={() => setHoveredSection(null)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span 
                  className="text-sm font-semibold"
                  style={{ color: 'var(--success-500)' }}
                >
                  Easy
                </span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {stats.easy.solved}/{stats.easy.total}
                </span>
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {easyPercentage}%
              </span>
            </div>
            {/* Progress Bar */}
            <div 
              className="relative w-full h-2 mt-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--success-100)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: 'var(--success-500)' }}
                initial={{ width: 0 }}
                animate={{ width: `${easyPercentage}%` }}
                transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </motion.div>

          {/* Medium */}
          <motion.div 
            className="rounded-lg p-4 transition-all cursor-pointer"
            style={{
              backgroundColor: hoveredSection === 'medium' ? 'var(--bg-secondary)' : 'var(--bg-tertiary)'
            }}
            onMouseEnter={() => setHoveredSection('medium')}
            onMouseLeave={() => setHoveredSection(null)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span 
                  className="text-sm font-semibold"
                  style={{ color: 'var(--warning-500)' }}
                >
                  Medium
                </span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {stats.medium.solved}/{stats.medium.total}
                </span>
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {mediumPercentage}%
              </span>
            </div>
            {/* Progress Bar */}
            <div 
              className="relative w-full h-2 mt-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--warning-100)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: 'var(--warning-500)' }}
                initial={{ width: 0 }}
                animate={{ width: `${mediumPercentage}%` }}
                transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </motion.div>

          {/* Hard */}
          <motion.div 
            className="rounded-lg p-4 transition-all cursor-pointer"
            style={{
              backgroundColor: hoveredSection === 'hard' ? 'var(--bg-secondary)' : 'var(--bg-tertiary)'
            }}
            onMouseEnter={() => setHoveredSection('hard')}
            onMouseLeave={() => setHoveredSection(null)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span 
                  className="text-sm font-semibold"
                  style={{ color: 'var(--error-500)' }}
                >
                  Hard
                </span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {stats.hard.solved}/{stats.hard.total}
                </span>
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {hardPercentage}%
              </span>
            </div>
            {/* Progress Bar */}
            <div 
              className="relative w-full h-2 mt-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--error-100)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: 'var(--error-500)' }}
                initial={{ width: 0 }}
                animate={{ width: `${hardPercentage}%` }}
                transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <motion.div 
        className="mt-6 pt-4 border-t"
        style={{ borderColor: 'var(--border-primary)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Overall Progress
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {totalStats.percentage}%
          </span>
        </div>
        <div 
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, var(--primary-500) 0%, var(--primary-600) 100%)'
            }}
            initial={{ width: 0 }}
            animate={{ width: `${totalStats.percentage}%` }}
            transition={{ delay: 0.9, duration: 1, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
