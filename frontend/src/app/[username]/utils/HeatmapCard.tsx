// app/profile/[username]/utils/HeatmapCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { ActivityHeatmapMonth } from 'react-activity-heatmap';
import { axiosClient } from '@/app/utils/axiosClient';
import { AxiosError } from 'axios';
import { motion } from 'framer-motion';

interface HeatmapData {
  date: string;
  count: number;
}

interface HeatmapCardProps {
  username: string;
}

// Convert API data to react-activity-heatmap format and compute level (0–4)
function toHeatmapActivity(item: HeatmapData): {
  date: Date;
  count: number;
  level: number;
} {
  const count = item.count;
  let level = 0;
  if (count >= 11) level = 4;
  else if (count >= 6) level = 3;
  else if (count >= 3) level = 2;
  else if (count >= 1) level = 1;
  return {
    date: new Date(item.date),
    count,
    level,
  };
}

export default function HeatmapCard({ username }: HeatmapCardProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const availableYears = [currentYear, currentYear - 1, currentYear - 2];

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        setLoading(true);
        const params = selectedYear === currentYear ? '' : `?year=${selectedYear}`;
        const response = await axiosClient.get(
          `/api/${username}/heatmap${params}`
        );

        if (response.data.success) {
          setHeatmapData(response.data.data || []);
        } else {
          setError(response.data.message || 'Failed to load heatmap');
        }
      } catch (err) {
        const e = err as AxiosError<{ message?: string }>;
        setError(
          e.response?.data?.message || e.message || 'An error occurred'
        );
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchHeatmapData();
    }
  }, [username, selectedYear]);

  const activities = heatmapData.map(toHeatmapActivity);
  const totalSubmissions = heatmapData.reduce((sum, item) => sum + item.count, 0);
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const handlePreviousYear = () => {
    if (selectedYear > availableYears[availableYears.length - 1]) {
      setSelectedYear(selectedYear - 1);
    }
  };

  const handleNextYear = () => {
    if (selectedYear < currentYear) {
      setSelectedYear(selectedYear + 1);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg p-6 shadow-lg space-y-6" style={{ backgroundColor: 'var(--bg-elevated)' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="skeleton h-6 w-44 rounded" />
            <div className="skeleton h-3.5 w-36 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="skeleton h-8 w-8 rounded-lg" />
            <div className="skeleton h-6 w-14 rounded" />
            <div className="skeleton h-8 w-8 rounded-lg" />
          </div>
        </div>

        {/* Heatmap — mirrors the real horizontal-scroll month blocks */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-max">
            {Array.from({ length: 12 }).map((_, m) => (
              <div key={m} className="flex flex-col gap-1" style={{ minWidth: 52 }}>
                {/* Month label */}
                <div className="skeleton h-3 w-8 rounded mb-1" />
                {/* 5 week-rows × 4 day-cells */}
                {Array.from({ length: 5 }).map((_, w) => (
                  <div key={w} className="flex gap-1">
                    {Array.from({ length: 4 }).map((_, d) => (
                      <div key={d} className="skeleton h-3 w-3 rounded-sm" />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div
          className="flex items-center justify-between pt-4 border-t"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <div className="skeleton h-3 w-8 rounded" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-3 w-3 rounded-sm" />
            ))}
          </div>
          <div className="skeleton h-3 w-8 rounded" />
        </div>
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
          Activity Heatmap
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-xl font-bold mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Activity Heatmap
          </h2>
          <p
            className="text-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {totalSubmissions} submissions in {selectedYear}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={handlePreviousYear}
            disabled={selectedYear <= availableYears[availableYears.length - 1]}
            className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent',
            }}
            whileHover={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              scale: 1.1,
            }}
            whileTap={{ scale: 0.95 }}
          >
            <FiChevronLeft size={20} />
          </motion.button>

          <span
            className="text-lg font-semibold min-w-[80px] text-center"
            style={{ color: 'var(--text-primary)' }}
          >
            {selectedYear}
          </span>

          <motion.button
            onClick={handleNextYear}
            disabled={selectedYear >= currentYear}
            className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent',
            }}
            whileHover={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              scale: 1.1,
            }}
            whileTap={{ scale: 0.95 }}
          >
            <FiChevronRight size={20} />
          </motion.button>
        </div>
      </div>

      <div
        className="overflow-x-auto pb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        <div className="flex gap-4 min-w-max">
          {months.map((m) => (
            <ActivityHeatmapMonth
              key={`${m}-${selectedYear}`}
              activities={activities}
              month={m}
              year={selectedYear}
              cellStyle={{
                borderRadius: '0.25rem',
                border: '1px solid var(--border-primary)',
              }}
              monthNameStyle={{
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
              }}
              tooltipStyle={{
                border: '1px solid var(--border-primary)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              customCellColors={{
                level0: 'var(--bg-tertiary)',
                level1: '#9BE9A8',
                level2: '#40C463',
                level3: '#30A14E',
                level4: '#216E39',
              }}
              monthNameFormat="short"
              customTooltipContent={(activity) => (
                <div>
                  <div className="font-semibold">
                    {activity.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {activity.count}{' '}
                    {activity.count === 1 ? 'submission' : 'submissions'}
                  </div>
                </div>
              )}
            />
          ))}
        </div>
      </div>

      <div
        className="flex items-center justify-between mt-6 pt-4 border-t gap-2"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Less
        </span>
        <div className="flex gap-1 items-center">
          <div
            className="w-3 h-3 rounded"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
            }}
          />
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: '#9BE9A8', border: '1px solid var(--border-primary)' }}
          />
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: '#40C463', border: '1px solid var(--border-primary)' }}
          />
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: '#30A14E', border: '1px solid var(--border-primary)' }}
          />
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: '#216E39', border: '1px solid var(--border-primary)' }}
          />
        </div>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          More
        </span>
      </div>
    </motion.div>
  );
}
