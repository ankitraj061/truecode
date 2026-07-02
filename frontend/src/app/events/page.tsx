// app/events/page.jsx
'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, Clock, ExternalLink, Loader2, Trophy, Users, Sparkles, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';
import { contestAPI, type ContestListItem } from '@/app/utils/contestAPI';

type Contest = {
  id: number | string;
  event?: string;
  host?: string;
  start: string | number | Date;
  duration?: number;
  href?: string;
  source?: 'clist' | 'truecode';
};

export default function EventTrackerPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [contests, setContests] = useState<Contest[]>([]);
  const [truecodeContests, setTruecodeContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentContestIndex, setCurrentContestIndex] = useState(0);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number; placement: string }>({ x: 0, y: 0, placement: 'bottom' });
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [fetchedMonths, setFetchedMonths] = useState<Set<string>>(new Set());
  const contestsCacheRef = useRef<{ [key: string]: Contest[] }>({});

  const username = process.env.NEXT_PUBLIC_CLIST_USERNAME;
  const apiKey = process.env.NEXT_PUBLIC_CLIST_API_KEY;
  
  const allowedSites = useMemo(() => [
    'codechef.com',
    'codeforces.com', 
    'leetcode.com',
    'atcoder.jp',
  ], []);

  const combinedContests = useMemo(() => [...contests, ...truecodeContests], [contests, truecodeContests]);

  const parseUTCDate = useCallback((dateString: string | number | Date) => {
    if (!dateString) return new Date();
    if (typeof dateString !== 'string') {
      return new Date(dateString);
    }
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      return new Date(dateString + 'Z');
    }
    return new Date(dateString);
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }, []);

  const formatToIST = useCallback((dateString: string | number | Date) => {
    try {
      const date = parseUTCDate(dateString);
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }, [parseUTCDate]);

  const formatTimeToIST = useCallback((dateString: string | number | Date) => {
    try {
      const date = parseUTCDate(dateString);
      return date.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Time';
    }
  }, [parseUTCDate]);

  const fetchContests = useCallback(async (startDate: unknown, endDate: unknown) => {
    const url = `https://clist.by/api/v3/contest/?username=${username}&api_key=${apiKey}&start__gte=${startDate}&end__lte=${endDate}&limit=100&order_by=start`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data && data.objects && Array.isArray(data.objects)) {
        const filteredContests = data.objects.filter((contest: { host: string; }) => 
          contest && contest.host && allowedSites.includes(contest.host)
        );
        return filteredContests;
      }
      return [];
    } catch (err) {
      throw err;
    }
  }, [username, apiKey, allowedSites]);

  const loadContestsForMonth = useCallback(async (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();
    
    const cacheKey = `${year}-${month}`;
    
    if (contestsCacheRef.current[cacheKey]) {
      return contestsCacheRef.current[cacheKey];
    }
    
    try {
      const monthContests = await fetchContests(startStr, endStr);
      contestsCacheRef.current[cacheKey] = monthContests;
      return monthContests;
    } catch (err) {
      throw err;
    }
  }, [fetchContests]);

  const upcomingContests = useMemo(() => {
    const now = new Date();
    return combinedContests
      .filter(contest => {
        const contestDate = parseUTCDate(contest.start);
        return contestDate >= now;
      })
      .sort((a, b) => {
        const dateA = parseUTCDate(a.start);
        const dateB = parseUTCDate(b.start);
        return dateA.getTime() - dateB.getTime();
      });
  }, [combinedContests, parseUTCDate]);

  const getContestsForDate = useCallback((date: { toDateString: () => string; }) => {
    return combinedContests.filter(contest => {
      try {
        const contestDate = parseUTCDate(contest.start);
        return contestDate.toDateString() === date.toDateString();
      } catch (error) {
        return false;
      }
    });
  }, [combinedContests, parseUTCDate]);

  const loadContests = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const thirdMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 1);
    
    const currentKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
    const nextKey = `${nextMonth.getFullYear()}-${nextMonth.getMonth()}`;
    const thirdKey = `${thirdMonth.getFullYear()}-${thirdMonth.getMonth()}`;
    
    const monthsToFetch: Date[] = [];
    if (!fetchedMonths.has(currentKey)) monthsToFetch.push(currentMonth);
    if (!fetchedMonths.has(nextKey)) monthsToFetch.push(nextMonth);
    if (!fetchedMonths.has(thirdKey)) monthsToFetch.push(thirdMonth);
    
    if (monthsToFetch.length === 0) {
      setLoading(false);
      return;
    }
    
    try {
      const results = await Promise.all(monthsToFetch.map(loadContestsForMonth));
      
      setFetchedMonths(prevFetchedMonths => {
        const newFetchedMonths = new Set(prevFetchedMonths);
        monthsToFetch.forEach(month => {
          const key = `${month.getFullYear()}-${month.getMonth()}`;
          newFetchedMonths.add(key);
        });
        return newFetchedMonths;
      });
      
      setContests(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newContests: Contest[] = [];
        
        results.forEach(monthContests => {
          monthContests.forEach((contest: Contest) => {
            if (!existingIds.has(contest.id)) {
              newContests.push(contest);
              existingIds.add(contest.id);
            }
          });
        });
        
        return [...prev, ...newContests];
      });
    } catch (err) {
      setError('Failed to load contests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentDate, fetchedMonths, loadContestsForMonth]);

  useEffect(() => {
    const fetchTruecodeContests = async () => {
      try {
        const [upcomingRes, runningRes, endedRes] = await Promise.all([
          contestAPI.list({ status: 'upcoming', page: 1, limit: 50 }),
          contestAPI.list({ status: 'running', page: 1, limit: 20 }),
          contestAPI.list({ status: 'ended', page: 1, limit: 100 }),
        ]);
        const mapOne = (c: ContestListItem): Contest => ({
          id: c._id,
          event: c.title,
          host: 'TrueCode',
          start: c.startTime,
          duration: (c.duration ?? 0) * 60,
          href: `/contests/${c._id}`,
          source: 'truecode',
        });
        const list: Contest[] = [
          ...(upcomingRes.contests || []).map(mapOne),
          ...(runningRes.contests || []).map(mapOne),
          ...(endedRes.contests || []).map(mapOne),
        ];
        const seen = new Set<string>();
        const deduped = list.filter(c => {
          const id = String(c.id);
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        setTruecodeContests(deduped);
      } catch {
        setTruecodeContests([]);
      }
    };
    fetchTruecodeContests();
  }, []);

  useEffect(() => {
    loadContests();
  }, [loadContests]);

  useEffect(() => {
    setCurrentContestIndex(0);
  }, [upcomingContests]);

  const navigateMonth = useCallback((direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  }, [currentDate]);

  const nextContest = useCallback(() => {
    if (upcomingContests.length === 0) return;
    setCurrentContestIndex(prev => 
      prev < upcomingContests.length - 1 ? prev + 1 : 0
    );
  }, [upcomingContests]);

  const prevContest = useCallback(() => {
    if (upcomingContests.length === 0) return;
    setCurrentContestIndex(prev => 
      prev > 0 ? prev - 1 : upcomingContests.length - 1
    );
  }, [upcomingContests]);

  const handleMouseEnter = useCallback((date: React.SetStateAction<Date | null>, event: { currentTarget: { getBoundingClientRect: () => unknown; }; }) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    setHoveredDate(date);
    
    const rect = event.currentTarget.getBoundingClientRect() as DOMRect;
    const tooltipWidth = 420;
    const tooltipHeight = 400;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 20;
    
    let x = rect.left + rect.width / 2;
    let y = rect.bottom + 15;
    let placement = 'bottom';
    
    if (x + tooltipWidth / 2 > viewportWidth - padding) {
      x = viewportWidth - tooltipWidth / 2 - padding;
    }
    
    if (x - tooltipWidth / 2 < padding) {
      x = tooltipWidth / 2 + padding;
    }
    
    if (y + tooltipHeight > viewportHeight - padding) {
      y = rect.top - 15;
      placement = 'top';
    }
    
    setTooltipPosition({ x, y, placement });
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isTooltipHovered) {
        setHoveredDate(null);
      }
    }, 100);
  }, [isTooltipHovered]);

  const handleTooltipMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsTooltipHovered(true);
  }, []);

  const handleTooltipMouseLeave = useCallback(() => {
    setIsTooltipHovered(false);
    setHoveredDate(null);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const renderCalendar = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const calendarDate = new Date(year, month, 1);
    const monthName = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ type: 'empty', key: `empty-${i}` });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ type: 'day', day, key: `day-${year}-${month}-${day}` });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return (
      <motion.div 
        className="card mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div 
          className="flex items-center justify-center gap-3 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Sparkles className="w-6 h-6" style={{ color: 'var(--primary-500)' }} />
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {monthName}
          </h2>
          <Sparkles className="w-6 h-6" style={{ color: 'var(--primary-500)' }} />
        </motion.div>
        
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <motion.div 
              key={`weekday-${day}`}
              className="text-center font-semibold py-3 rounded-lg"
              style={{ 
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-secondary)'
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              {day}
            </motion.div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {days.map((item, index) => {
            if (item.type === 'empty') {
              return <div key={item.key} className="h-28"></div>;
            }
            
            const { day } = item;
            const date = new Date(year, month, day);
            const dayContests = getContestsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const isPast = date < today;
            const hasContests = dayContests.length > 0;
            
            return (
              <motion.div
                key={item.key}
                className={`h-28 border-2 p-2 overflow-hidden relative cursor-pointer rounded-lg group transition-all duration-300 ${
                  isToday 
                    ? 'shadow-lg' 
                    : hasContests
                    ? 'hover:shadow-md'
                    : 'hover:shadow-sm'
                } ${isPast ? 'opacity-60' : ''}`}
                style={{
                  backgroundColor: isToday ? 'var(--primary-500)' : 'var(--bg-elevated)',
                  borderColor: isToday 
                    ? 'var(--primary-500)' 
                    : hasContests 
                    ? 'var(--primary-400)'
                    : 'var(--border-primary)'
                }}
                onMouseEnter={(e) => handleMouseEnter(date, e)}
                onMouseLeave={handleMouseLeave}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: index * 0.01, 
                  duration: 0.2,
                  ease: "easeOut"
                }}
                whileHover={{ 
                  scale: 1.03,
                  transition: { duration: 0.2 }
                }}
              >
                {hasContests && !isPast && (
                  <motion.div 
                    className="absolute top-1 right-1 w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--primary-500)' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
                
                <motion.div 
                  className="text-lg font-bold mb-2"
                  style={{ 
                    color: isToday ? '#FFFFFF' : 'var(--text-primary)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  {day}
                </motion.div>
                
                <div className="space-y-1">
                  {dayContests.slice(0, 2).map((contest, idx) => (
                    <motion.div
                      key={`contest-${contest.id}-${idx}`}
                      className="text-xs px-1.5 py-1 rounded truncate shadow-sm backdrop-blur-sm"
                      style={{
                        backgroundColor: 'var(--primary-500)',
                        color: '#FFFFFF'
                      }}
                      title={contest.event || 'Contest'}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1, duration: 0.3 }}
                      whileHover={{ 
                        scale: 1.05,
                        backgroundColor: "var(--primary-600)",
                        transition: { duration: 0.2 }
                      }}
                    >
                      {contest.event ? (
                        contest.event.length > 12 ? contest.event.substring(0, 12) + '...' : contest.event
                      ) : 'Contest'}
                    </motion.div>
                  ))}
                  {dayContests.length > 2 && (
                    <motion.div 
                      className="text-xs font-medium"
                      style={{ color: 'var(--primary-500)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      +{dayContests.length - 2} more
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }, [currentDate, getContestsForDate, handleMouseEnter, handleMouseLeave]);

  const renderContestSlider = useCallback(() => {
    if (upcomingContests.length === 0) {
      return (
        <motion.div 
          className="card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Trophy className="w-6 h-6" style={{ color: 'var(--primary-500)' }} />
            Upcoming Contests
          </h3>
          <motion.div
            className="text-center py-8"
            style={{ color: 'var(--text-secondary)' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p>No upcoming contests found</p>
          </motion.div>
        </motion.div>
      );
    }

    const contest = upcomingContests[currentContestIndex];
    if (!contest) return null;
    
    return (
      <motion.div 
        className="card"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <motion.h3 
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Trophy className="w-6 h-6" style={{ color: 'var(--primary-500)' }} />
            Upcoming Contests
          </motion.h3>
          <motion.div 
            className="text-sm px-3 py-1 rounded-full font-medium"
            style={{
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-secondary)'
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {currentContestIndex + 1} / {upcomingContests.length}
          </motion.div>
        </div>
        
        <div className="relative">
          {upcomingContests.length > 1 && (
            <>
              <motion.button 
                onClick={prevContest}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 btn-primary p-3 rounded-full z-10 shadow-lg"
                whileHover={{ scale: 1.1, x: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              
              <motion.button 
                onClick={nextContest}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 btn-primary p-3 rounded-full z-10 shadow-lg"
                whileHover={{ scale: 1.1, x: 2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </>
          )}
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={`contest-slider-${currentContestIndex}`}
              className={`rounded-xl p-6 border ${upcomingContests.length > 1 ? 'mx-12' : ''}`}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)'
              }}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <motion.h4 
                className="font-bold mb-4 text-center text-lg"
                style={{ color: 'var(--text-primary)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {contest.event || 'Contest'}
              </motion.h4>
              
              <div className="text-sm space-y-3" style={{ color: 'var(--text-secondary)' }}>
                <motion.div 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  whileHover={{ x: 2 }}
                >
                  <ExternalLink className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--primary-500)' }} />
                  <span className="truncate font-medium">Platform: {contest.host || 'Unknown'}</span>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ x: 2 }}
                >
                  <Clock className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--primary-500)' }} />
                  <span className="font-medium">Start: {formatToIST(contest.start)} (IST)</span>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  whileHover={{ x: 2 }}
                >
                  <Users className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--primary-500)' }} />
                  <span className="font-medium">Duration: {formatDuration(contest.duration ?? 0)}</span>
                </motion.div>
              </div>
              
              {contest.href && (
                <motion.div 
                  className="flex justify-center mt-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {contest.source === 'truecode' ? (
                    <Link href={contest.href}>
                      <motion.span
                        className="btn-primary px-6 py-3 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        View Contest
                        <ExternalLink className="w-4 h-4" />
                      </motion.span>
                    </Link>
                  ) : (
                    <motion.a
                      href={contest.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary px-6 py-3 text-sm font-semibold inline-flex items-center gap-2"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      View Contest
                      <ExternalLink className="w-4 h-4" />
                    </motion.a>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {upcomingContests.length > 1 && (
          <motion.div 
            className="flex justify-center mt-6 space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {upcomingContests.map((_, index) => (
              <motion.button
                key={`indicator-${index}`}
                onClick={() => setCurrentContestIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentContestIndex 
                    ? 'w-8' 
                    : 'w-2'
                }`}
                style={{
                  backgroundColor: index === currentContestIndex 
                    ? 'var(--primary-500)' 
                    : 'var(--bg-tertiary)'
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    );
  }, [upcomingContests, currentContestIndex, prevContest, nextContest, formatToIST, formatDuration]);

  const renderHoverTooltip = useCallback(() => {
    if (!hoveredDate) return null;
    
    const dayContests = getContestsForDate(hoveredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = hoveredDate < today;
    
    return (
      <AnimatePresence>
        {hoveredDate && (
          <motion.div 
            ref={tooltipRef}
            className="fixed card z-[9999] max-w-md shadow-2xl"
            style={{ 
              left: `${tooltipPosition.x}px`,
              top: tooltipPosition.placement === 'top' ? `${tooltipPosition.y}px` : `${tooltipPosition.y}px`,
              transform: tooltipPosition.placement === 'top' ? 'translate(-50%, -100%)' : 'translateX(-50%)',
              pointerEvents: 'auto',
            }}
            initial={{ opacity: 0, scale: 0.9, y: tooltipPosition.placement === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: tooltipPosition.placement === 'top' ? 10 : -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            {/* Arrow indicator */}
            <div 
              className={`absolute left-1/2 transform -translate-x-1/2 w-3 h-3 border-2 z-10 ${
                tooltipPosition.placement === 'top' 
                  ? 'bottom-[-7px] border-r border-b rotate-45' 
                  : 'top-[-7px] border-l border-t rotate-45'
              }`}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-primary)'
              }}
            />
            
            <motion.div 
              className="text-lg font-bold mb-4 flex items-center gap-2 border-b pb-3"
              style={{
                color: 'var(--text-primary)',
                borderColor: 'var(--border-primary)'
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--primary-500)' }} />
              <span className="flex-1">
                {hoveredDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              {isPast && <span className="text-xs font-semibold" style={{ color: 'var(--error-500)' }}>PAST</span>}
            </motion.div>
            
            {dayContests.length === 0 ? (
              <motion.div
                className="text-center py-8"
                style={{ color: 'var(--text-secondary)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-base">No contests scheduled</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Check back later for updates</p>
              </motion.div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {dayContests.length} {dayContests.length === 1 ? 'Contest' : 'Contests'} Found
                  </span>
                  {dayContests.length > 3 && (
                    <span className="text-xs px-2 py-1 rounded-full" style={{
                      color: 'var(--primary-500)',
                      backgroundColor: 'var(--primary-50)'
                    }}>
                      Scroll to view all
                    </span>
                  )}
                </div>
                
                <motion.div 
                  className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {dayContests.map((contest, index) => (
                    <motion.div 
                      key={`tooltip-contest-${contest.id}-${index}`}
                      className="rounded-lg p-4 border hover:shadow-md transition-all"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-primary)'
                      }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + index * 0.05 }}
                    >
                      <h4 className="font-semibold mb-3 text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
                        {contest.event || 'Contest'}
                      </h4>
                      <div className="text-xs space-y-2" style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary-500)' }} />
                          <span className="font-medium">{contest.host || 'Unknown Platform'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary-500)' }} />
                          <span>{formatTimeToIST(contest.start)} IST</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary-500)' }} />
                          <span>{formatDuration(contest.duration ?? 0)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }, [hoveredDate, getContestsForDate, tooltipPosition, formatTimeToIST, formatDuration, handleTooltipMouseEnter, handleTooltipMouseLeave]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--bg-tertiary);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--primary-500);
          border-radius: 4px;
          border: 2px solid var(--bg-secondary);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--primary-600);
        }
      `}</style>

      {/* Header */}
      <section className="border-b" style={{ 
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border-primary)'
      }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div 
            className="flex items-center justify-between flex-wrap gap-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1 
              className="text-4xl font-bold flex items-center gap-3"
              style={{ color: 'var(--text-primary)' }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Calendar className="w-10 h-10" style={{ color: 'var(--primary-500)' }} />
              </motion.div>
              Contest Calendar
            </motion.h1>
            
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => navigateMonth(-1)}
                className="btn-primary p-3"
                whileHover={{ scale: 1.1, x: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              
              <motion.span 
                className="font-semibold text-lg px-4 py-2 rounded-lg min-w-[180px] text-center"
                style={{
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-secondary)'
                }}
                key={currentDate.getMonth()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </motion.span>
              
              <motion.button
                onClick={() => navigateMonth(1)}
                className="btn-primary p-3"
                whileHover={{ scale: 1.1, x: 2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar skeleton */}
            <div className="lg:col-span-2 rounded-xl p-6 space-y-4" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}>
              {/* Month title */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="skeleton h-5 w-5 rounded" />
                <div className="skeleton h-7 w-44 rounded" />
                <div className="skeleton h-5 w-5 rounded" />
              </div>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="skeleton h-10 rounded-lg" />
                ))}
              </div>
              {/* Day cells — 5 rows × 7 cols */}
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="skeleton h-28 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Contest slider skeleton */}
            <div className="lg:col-span-1 rounded-xl p-6 space-y-5" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="skeleton h-6 w-6 rounded" />
                  <div className="skeleton h-6 w-36 rounded" />
                </div>
                <div className="skeleton h-6 w-12 rounded-full" />
              </div>
              <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                <div className="skeleton h-5 w-3/4 mx-auto rounded" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-11 w-full rounded-lg" />
                ))}
                <div className="skeleton h-10 w-32 mx-auto rounded-lg mt-2" />
              </div>
              {/* Dot indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`skeleton rounded-full h-2 ${i === 0 ? 'w-8' : 'w-2'}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div 
              className="border p-6 rounded-xl mb-6 flex items-center gap-3"
              style={{
                backgroundColor: 'var(--error-100)',
                borderColor: 'var(--error-500)',
                color: 'var(--error-500)'
              }}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <ExternalLink className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && !error && (
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="lg:col-span-2">
              {renderCalendar()}
            </div>
            
            <div className="lg:col-span-1">
              {renderContestSlider()}
            </div>
          </motion.div>
        )}
      </div>

      {/* About Section */}
      <motion.section
        className="max-w-7xl mx-auto px-6 pb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="rounded-xl p-6 md:p-8"
          style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Info className="w-6 h-6" style={{ color: 'var(--primary-500)' }} />
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              About this page
            </h2>
          </div>
          <p className="text-sm leading-relaxed mb-6 max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
            The Contest Calendar brings together upcoming, running and past competitive
            programming contests from across the web into a single view, so you don&apos;t
            have to check multiple sites to plan your practice. Click any date or contest
            card for details, or jump straight to the host platform to register.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { name: 'LeetCode', desc: 'Weekly & biweekly contests' },
              { name: 'Codeforces', desc: 'Div. 1–4 rounds & educational rounds' },
              { name: 'CodeChef', desc: 'Long Challenge, Cook-Off & Starters' },
              { name: 'AtCoder', desc: 'ABC, ARC & AGC contests' },
              { name: 'TrueCode', desc: 'Contests hosted on this platform' },
            ].map((platform) => (
              <div
                key={platform.name}
                className="rounded-lg p-3 flex flex-col gap-1"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {platform.name}
                </span>
                <span className="text-xs leading-snug" style={{ color: 'var(--text-tertiary)' }}>
                  {platform.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {renderHoverTooltip()}

      <Footer />
    </div>
  );
}
