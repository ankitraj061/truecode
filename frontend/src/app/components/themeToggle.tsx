'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useSelector } from 'react-redux';
import { axiosClient } from '../utils/axiosClient';
import { RootState } from '../problems/utils/types';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);

  const updateUserTheme = async (theme: string) => {
    if (!user?._id) return;
    try {
      await axiosClient.post(`/api/theme`, { theme });
    } catch (error) {
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const _toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    updateUserTheme(newTheme);
  };

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg bg-secondary animate-pulse"></div>
    );
  }

  return (
    <AnimatedThemeToggler />
  );
}
