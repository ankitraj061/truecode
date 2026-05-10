// app/profile/[username]/utils/BadgesCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { FiAward } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { axiosClient } from '@/app/utils/axiosClient';
import { AxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface BadgesCardProps {
  username: string;
}

interface Badge {
  name: string;
  description: string;
  iconUrl: string;
  _id: string;
  earnedAt: string;
}

interface ProfileResponse {
  success: boolean;
  data: {
    badges: Badge[];
  };
  message?: string;
}

export default function BadgesCard({ username }: BadgesCardProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get<ProfileResponse>(
          `/api/${username}/profile`
        );

        if (response.data.success) {
          setBadges(response.data.data.badges || []);
        } else {
          setError(response.data.message || 'Failed to load badges');
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        setError(
          axiosError.response?.data?.message ||
          axiosError.message ||
          "An error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchBadges();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="rounded-lg p-6 bg-elevated shadow-lg space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="skeleton h-5 w-20 rounded" />
          <div className="skeleton h-5 w-8 rounded" />
        </div>
        {/* Badge circles grid */}
        <div className="grid grid-cols-3 gap-8 justify-items-center">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton w-24 h-24 rounded-full" />
          ))}
        </div>
        {/* Footer */}
        <div className="pt-4 border-t border-primary">
          <div className="skeleton h-3 w-3/4 rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="rounded-lg p-6 shadow-lg"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2 
          className="text-xl font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Badges
        </h2>
        <p className="text-sm" style={{ color: 'var(--error-500)' }}>
          {error}
        </p>
      </motion.div>
    );
  }

  if (badges.length === 0) {
    return (
      <motion.div 
        className="rounded-lg p-6 shadow-lg"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 
            className="text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Badges
          </h2>
          <div className="flex items-center gap-2">
            <FiAward 
              size={24} 
              style={{ color: 'var(--accent-500)' }}
            />
            <span 
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              0
            </span>
          </div>
        </div>

        {/* Empty State */}
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FiAward 
              className="mx-auto mb-4"
              size={64}
              style={{ color: 'var(--text-tertiary)' }}
            />
          </motion.div>
          <p 
            className="text-base font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            No badges earned yet
          </p>
          <p 
            className="text-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Start solving problems to earn your first badge!
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="rounded-lg p-6 shadow-lg"
      style={{ backgroundColor: 'var(--bg-elevated)' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 
          className="text-xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Badges
        </h2>
        <div className="flex items-center gap-2">
          <FiAward 
            size={24} 
            style={{ color: 'var(--accent-500)' }}
          />
          <span 
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {badges.length}
          </span>
        </div>
      </motion.div>

      {/* Larger Badges Grid */}
      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-3 gap-8 justify-items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {badges.map((badge, index) => (
          <BadgeImage
            key={badge._id || index}
            badge={badge}
            index={index}
          />
        ))}
      </motion.div>

      {/* Info Footer */}
      <motion.div 
        className="mt-6 pt-6 border-t"
        style={{ borderColor: 'var(--border-primary)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p 
          className="text-sm text-center"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Earn more badges by solving problems and participating in contests!
        </p>
      </motion.div>
    </motion.div>
  );
}

// Just Image - No Container Wrapper
interface BadgeImageProps {
  badge: Badge;
  index: number;
}

function BadgeImage({ badge, index }: BadgeImageProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      className="relative w-32 h-32"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        delay: index * 0.05, 
        duration: 0.3,
        type: "spring",
        stiffness: 250
      }}
    >
      {/* Just the Image - Nothing Else */}
      {badge.iconUrl && !imageError ? (
        <motion.img
          src={badge.iconUrl}
          alt={badge.name}
          className="w-full h-full rounded-full object-cover cursor-pointer"
          style={{
            border: '3px solid var(--border-primary)'
          }}
          onError={() => setImageError(true)}
          whileHover={{ 
            scale: 1.1, 
            rotate: 5,
            borderColor: 'var(--primary-500)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        />
      ) : (
        <motion.div
          className="w-full h-full rounded-full flex items-center justify-center cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, var(--gray-600), var(--gray-700))',
            border: '3px solid var(--border-primary)',
            color: 'var(--text-tertiary)'
          }}
          whileHover={{ 
            scale: 1.1, 
            rotate: 5,
            borderColor: 'var(--primary-500)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <FiAward className="w-1/2 h-1/2" />
        </motion.div>
      )}

      {/* Sparkle on Hover */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="absolute -top-1 -right-1 pointer-events-none"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 180 }}
            exit={{ scale: 0, rotate: 360 }}
            transition={{ duration: 0.3 }}
          >
            <HiSparkles 
              size={24} 
              style={{ color: 'var(--accent-500)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div 
            className="absolute bottom-full left-1/2 mb-3 z-50 px-4 py-3 rounded-lg shadow-2xl pointer-events-none"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '2px solid var(--border-secondary)',
              color: 'var(--text-primary)',
              transform: 'translateX(-50%)',
              minWidth: '200px',
              maxWidth: '280px'
            }}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="font-bold text-base mb-2 text-center">
              {badge.name}
            </div>
            
            <div 
              className="text-sm text-center mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {badge.description}
            </div>
            
            {badge.earnedAt && (
              <div 
                className="text-xs text-center pt-2 border-t"
                style={{ 
                  color: 'var(--text-tertiary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                🎉 {new Date(badge.earnedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            )}
            
            {/* Arrow */}
            <div 
              className="absolute top-full left-1/2 -mt-[2px]"
              style={{
                width: 0,
                height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: '10px solid var(--border-secondary)',
                transform: 'translateX(-50%)'
              }}
            />
            <div 
              className="absolute top-full left-1/2 -mt-[4px]"
              style={{
                width: 0,
                height: 0,
                borderLeft: '9px solid transparent',
                borderRight: '9px solid transparent',
                borderTop: `9px solid var(--bg-elevated)`,
                transform: 'translateX(-50%)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}