// app/profile/[username]/utils/ProfileHeader.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import { User } from '../page';
import EditProfileModal from './EditProfileModal';
import { Pencil, MapPin, Mail, User as UserIcon, UserPlus, UserCheck, Loader2, Cake } from 'lucide-react';
import { axiosClient } from '@/app/utils/axiosClient';
import { AxiosError } from 'axios';
import { motion } from 'framer-motion';
import { BorderBeam } from '@/components/ui/border-beam'; // Import BorderBeam

interface ProfileData {
  firstName: string;
  lastName: string;
  username: string;
  emailId: string;
  bio: string;
  location: string;
  gender: string;
  age: number | null;
  currentStreak: number;
  longestStreak: number;
  followingCount: number;
  followersCount: number;
  badges: string[];
}

interface ProfileHeaderProps {
  username: string;
}

export default function ProfileHeader({ username }: ProfileHeaderProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Follow states
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);

  // Check if logged-in user is viewing their own profile
  const isOwnProfile = user?.username === username;

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/api/${username}/profile`);

        if (response.data.success) {
          setProfileData(response.data.data);
        } else {
          setError(response.data.message || 'Failed to load profile');
        }
      } catch (error) {
        const err = error as AxiosError<{ error?: string }>;
        setError(
          err.response?.data?.error ||
          err.message ||
          'An error occurred'
        );
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  // Fetch follow status (only if viewing someone else's profile)
  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!user || isOwnProfile) {
        return;
      }

      try {
        const response = await axiosClient.get(`/api/${username}/follow-status`);

        if (response.data.success) {
          setIsFollowing(response.data.data.isFollowing);
        }
      } catch (error) {
      }
    };

    if (username && user && !isOwnProfile) {
      fetchFollowStatus();
    }
  }, [username, user, isOwnProfile]);

  // Handle follow/unfollow toggle
  const handleFollowToggle = async () => {
    if (!user) {
      setFollowError('Please log in to follow users');
      return;
    }

    setFollowLoading(true);
    setFollowError(null);

    try {
      if (isFollowing) {
        const response = await axiosClient.delete(`/api/${username}/unfollow`);

        if (response.data.success) {
          setIsFollowing(false);
          setProfileData((prev) =>
            prev ? { ...prev, followersCount: prev.followersCount - 1 } : null
          );
        } else {
          setFollowError(response.data.error || 'Failed to unfollow');
        }
      } else {
        const response = await axiosClient.post(`/api/${username}/follow`);

        if (response.data.success) {
          setIsFollowing(true);
          setProfileData((prev) =>
            prev ? { ...prev, followersCount: prev.followersCount + 1 } : null
          );
        } else {
          setFollowError(response.data.error || 'Failed to follow');
        }
      }
    } catch (error) {
      const err = error as AxiosError<{ error?: string }>;
      setFollowError(
        err.response?.data?.error || err.message || 'An error occurred'
      );
    } finally {
      setFollowLoading(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = (updatedData: Partial<ProfileData>) => {
    setProfileData((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  if (loading) {
    return (
      <div
        className="rounded-lg p-5 shadow-lg space-y-4"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
      >
        {/* Avatar skeleton */}
        <div className="flex flex-col items-center gap-3">
          <div className="skeleton w-20 h-20 rounded-full" />
          <div className="skeleton h-5 w-36 rounded" />
          <div className="skeleton h-3.5 w-24 rounded" />
        </div>
        {/* Bio skeleton */}
        <div className="space-y-2">
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-4/5 rounded" />
        </div>
        {/* Info skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div className="skeleton w-4 h-4 rounded" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
          ))}
        </div>
        {/* Divider */}
        <div className="skeleton h-px w-full rounded" />
        {/* Stats skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex justify-between items-center">
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton h-5 w-8 rounded" />
            </div>
          ))}
        </div>
        {/* Button skeleton */}
        <div className="skeleton h-9 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div
        className="border rounded-lg p-6"
        style={{
          backgroundColor: 'var(--error-50)',
          borderColor: 'var(--error-500)'
        }}
      >
        <p style={{ color: 'var(--error-500)' }}>
          {error || 'Profile not found'}
        </p>
      </div>
    );
  }

  const statRows = [
    { label: 'Current Streak', value: profileData.currentStreak, color: 'var(--accent-500)', suffix: profileData.currentStreak === 1 ? ' day' : ' days' },
    { label: 'Longest Streak', value: profileData.longestStreak, color: 'var(--accent-600)', suffix: profileData.longestStreak === 1 ? ' day' : ' days' },
    { label: 'Following', value: profileData.followingCount, color: 'var(--primary-500)', suffix: '' },
    { label: 'Followers', value: profileData.followersCount, color: 'var(--success-500)', suffix: '' },
    { label: 'Badges', value: profileData.badges.length, color: 'var(--accent-500)', suffix: '' },
  ];

  return (
    <>
      <motion.div
        className="relative rounded-lg p-5 shadow-lg overflow-hidden flex flex-col gap-4"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Avatar & Identity */}
        <div className="flex flex-col items-center text-center gap-2">
          {/* Avatar circle */}
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shadow-md"
              style={{
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                color: '#FFFFFF'
              }}
            >
              {profileData.firstName.charAt(0).toUpperCase()}
              {profileData.lastName.charAt(0).toUpperCase()}
            </div>

            {/* Streak fire badge */}
            {profileData.currentStreak > 0 && (
              <motion.div
                className="absolute -bottom-2 -right-2 text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg"
                style={{
                  backgroundColor: 'var(--accent-500)',
                  color: '#FFFFFF'
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                🔥 {profileData.currentStreak}
              </motion.div>
            )}
          </motion.div>

          {/* Full name */}
          <motion.h1
            className="text-xl font-bold leading-tight"
            style={{ color: 'var(--text-primary)' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {profileData.firstName} {profileData.lastName}
          </motion.h1>

          {/* @username */}
          <motion.p
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            @{profileData.username}
          </motion.p>

          {/* Bio */}
          {profileData.bio && (
            <motion.p
              className="text-sm mt-1 leading-snug"
              style={{ color: 'var(--text-secondary)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {profileData.bio}
            </motion.p>
          )}
        </div>

        {/* Info list */}
        {(profileData.emailId || profileData.location || profileData.gender || profileData.age) && (
          <motion.div
            className="flex flex-col gap-2 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            {profileData.emailId && (
              <div
                className="flex items-center gap-2 min-w-0"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Mail className="shrink-0" style={{ color: 'var(--primary-500)' }} />
                <span className="truncate">{profileData.emailId}</span>
              </div>
            )}
            {profileData.location && (
              <div
                className="flex items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <MapPin className="shrink-0" style={{ color: 'var(--success-500)' }} />
                <span>{profileData.location}</span>
              </div>
            )}
            {profileData.gender && (
              <div
                className="flex items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <UserIcon className="shrink-0" style={{ color: 'var(--primary-400)' }} />
                <span className="capitalize">{profileData.gender}</span>
              </div>
            )}
            {profileData.age && (
              <div
                className="flex items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Cake className="shrink-0" style={{ color: 'var(--accent-500)' }} />
                <span>{profileData.age} years old</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Divider */}
        <div
          className="h-px w-full"
          style={{ backgroundColor: 'var(--border-primary)' }}
        />

        {/* Stats rows */}
        <motion.div
          className="flex flex-col gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          {statRows.map(({ label, value, color, suffix }) => (
            <motion.div
              key={label}
              className="flex items-center justify-between text-sm"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.15 }}
            >
              <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
              <span className="font-bold" style={{ color }}>
                {value}{suffix}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <div
          className="h-px w-full"
          style={{ backgroundColor: 'var(--border-primary)' }}
        />

        {/* Action button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          {isOwnProfile ? (
            <motion.button
              onClick={() => setIsEditModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all font-medium"
              style={{
                backgroundColor: 'var(--primary-500)',
                color: '#FFFFFF'
              }}
              whileHover={{ scale: 1.03, backgroundColor: 'var(--primary-600)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              <Pencil size={16} />
              <span>Edit Profile</span>
            </motion.button>
          ) : user ? (
            <div>
              <motion.button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isFollowing ? 'var(--bg-secondary)' : 'var(--primary-500)',
                  color: isFollowing ? 'var(--text-primary)' : '#FFFFFF',
                  border: isFollowing ? '1px solid var(--border-secondary)' : 'none'
                }}
                whileHover={{ scale: followLoading ? 1 : 1.03 }}
                whileTap={{ scale: followLoading ? 1 : 0.97 }}
                transition={{ duration: 0.2 }}
              >
                {followLoading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : isFollowing ? (
                  <>
                    <UserCheck size={16} />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Follow</span>
                  </>
                )}
              </motion.button>
              {followError && (
                <motion.p
                  className="text-xs mt-1 text-center"
                  style={{ color: 'var(--error-500)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {followError}
                </motion.p>
              )}
            </div>
          ) : null}
        </motion.div>

        {/* BorderBeam Effects */}
        <BorderBeam
          duration={8}
          size={500}
          className="from-transparent via-purple-500 to-transparent"
        />
        <BorderBeam
          duration={8}
          delay={4}
          size={500}
          borderWidth={2}
          className="from-transparent via-blue-500 to-transparent"
        />
      </motion.div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          profileData={profileData}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
}
