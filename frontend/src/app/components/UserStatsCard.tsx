'use client';

import Link from 'next/link';
import { Star, CheckCircle2, Flame, Trophy, ArrowRight } from 'lucide-react';

interface UserStatsCardProps {
  totalPoints?: number;
  solvedProblems?: number;
  contestsParticipated?: number;
  currentStreak?: number;
  redeemablePoints?: number;
}

export default function UserStatsCard({
  totalPoints = 0,
  solvedProblems = 0,
  contestsParticipated = 0,
  currentStreak = 0,
  redeemablePoints = 0,
}: UserStatsCardProps) {
  return (
    <div className="relative">
      {/* Floating Elements */}
      <div className="absolute -top-4 -left-4 w-24 h-24 bg-brand/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative card glass border-2 border-primary hover:border-brand/50 transition-all p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-primary">Your Stats</h3>
          <div className="flex items-center space-x-2 bg-success/10 text-success px-3 py-1 rounded-full text-xs font-medium border border-success/20">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
            <span>Active</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Total Points */}
          <div className="bg-secondary rounded-lg p-4 border border-primary hover:border-brand/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-secondary text-sm font-medium">Total Points</span>
              <Star className="w-5 h-5 text-brand" />
            </div>
            <div className="text-3xl font-bold text-brand">{totalPoints.toLocaleString()}</div>
            <div className="text-xs text-tertiary mt-1">From contests & problems</div>
          </div>

          {/* Problems Solved */}
          <div className="bg-secondary rounded-lg p-4 border border-primary hover:border-brand/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-secondary text-sm font-medium">Problems Solved</span>
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div className="text-3xl font-bold text-success">{solvedProblems}</div>
            <div className="text-xs text-tertiary mt-1">Across all categories</div>
          </div>

          {/* Current Streak */}
          <div className="bg-secondary rounded-lg p-4 border border-primary hover:border-brand/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-secondary text-sm font-medium">Current Streak</span>
              <Flame className="w-5 h-5 text-warning" />
            </div>
            <div className="text-3xl font-bold text-warning">{currentStreak} days</div>
            <div className="text-xs text-tertiary mt-1">Keep it going!</div>
          </div>

          {/* Contests */}
          <div className="bg-secondary rounded-lg p-4 border border-primary hover:border-brand/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-secondary text-sm font-medium">Contests</span>
              <Trophy className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400">{contestsParticipated}</div>
            <div className="text-xs text-tertiary mt-1">Participated in</div>
          </div>
        </div>

        {/* Redeemable Points Section */}
        {redeemablePoints > 0 && (
          <div className="bg-gradient-to-r from-brand/20 to-purple-500/20 rounded-lg p-4 border border-brand/30 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-secondary font-medium mb-1">Redeemable Points</div>
                <div className="text-2xl font-bold text-brand">{redeemablePoints.toLocaleString()}</div>
              </div>
              <Link
                href="/redeem"
                className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand/90 transition-colors"
              >
                Redeem
              </Link>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Link
            href="/problems"
            className="w-full flex items-center justify-center px-4 py-3 bg-brand text-white rounded-lg font-semibold hover:bg-brand/90 transition-colors"
          >
            Continue Solving
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>

          <Link
            href="/contests"
            className="w-full flex items-center justify-center px-4 py-3 bg-secondary border border-primary text-primary rounded-lg font-semibold hover:border-brand/60 transition-colors"
          >
            View Contests
          </Link>
        </div>

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-primary">
          <p className="text-xs text-tertiary text-center">
            Points are earned by solving problems and winning contests. Keep practicing to earn more rewards!
          </p>
        </div>
      </div>
    </div>
  );
}
