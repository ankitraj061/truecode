'use client';

import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Footer from './components/Footer';
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import ShowcaseModal from './components/ShowcaseModal';
import { AchievementBadgesStrip } from './components/AchievementBadgesStrip';
import UserStatsCard from './components/UserStatsCard';
import { Bot, Trophy, Target, Gift, BookOpen, ArrowRight } from 'lucide-react';
export default function Home() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-primary">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-elevated">
        {/* FlickeringGrid Background */}
        <div className="absolute inset-0 z-0">
          <FlickeringGrid
            className="absolute inset-0 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
            squareSize={4}
            gridGap={6}
            color="#4ade80"
            maxOpacity={0.4}
            flickerChance={0.1}
          />
        </div>

        {/* Animated Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/8 via-transparent to-emerald-500/8 animate-gradient-shift z-[1]"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in">
              {isAuthenticated && user && (
                <div className="inline-flex items-center space-x-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-medium border border-success/20">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                  <span>Welcome back, {user.firstName}!</span>
                </div>
              )}
              
              <h1 className="text-5xl lg:text-7xl font-bold text-primary leading-tight tracking-tight">
                {isAuthenticated ? (
                  <>Master Coding with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-emerald-400">AI Power</span></>
                ) : (
                  <>Code. Compete. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-emerald-400">Conquer.</span></>
                )}
              </h1>
              
              <p className="text-xl text-secondary leading-relaxed max-w-xl">
                {isAuthenticated ? (
                  <>Your next breakthrough is one problem away. Continue your journey with AI-powered hints and personalized challenges.</>
                ) : (
                  <>Practice 1000+ DSA problems, compete in weekly contests, earn rewards, and get AI assistance — all in one platform.</>
                )}
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-[var(--secondary)] px-4 py-2 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/40 transition-colors">
                  <Bot className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">AI ChatAI</span>
                </div>
                <div className="flex items-center gap-2 bg-[var(--secondary)] px-4 py-2 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/40 transition-colors">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Weekly Contests</span>
                </div>
                <div className="flex items-center gap-2 bg-[var(--secondary)] px-4 py-2 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/40 transition-colors">
                  <Gift className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Redeem Merch</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/problems"
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-[var(--primary)] rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-xl hover:shadow-[var(--primary)]/30">
                  <span className="relative z-10 flex items-center gap-2">
                    {isAuthenticated ? 'Start Solving' : 'Get Started Free'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>

                <button
                  type="button"
                  onClick={() => setShowShowcase(true)}
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary bg-secondary border-2 border-primary rounded-lg hover:border-brand/60 transition-all hover:scale-105"
                >
                  How TrueCode Works
                </button>
              </div>

              {/* Social Proof */}
              {!isAuthenticated && (
                <div className="flex items-center space-x-6 pt-6 border-t border-primary">
                  <div>
                    <div className="text-2xl font-bold text-primary">10K+</div>
                    <div className="text-sm text-secondary">Active Users</div>
                  </div>
                  <div className="h-12 w-px bg-primary"></div>
                  <div>
                    <div className="text-2xl font-bold text-primary">1000+</div>
                    <div className="text-sm text-secondary">Problems</div>
                  </div>
                  <div className="h-12 w-px bg-primary"></div>
                  <div>
                    <div className="text-2xl font-bold text-primary">50+</div>
                    <div className="text-sm text-secondary">Companies</div>
                  </div>
                </div>
              )}

            </div>
            
            {/* Right Content - User Stats Card */}
            <UserStatsCard
              totalPoints={user?.points || 0}
              solvedProblems={user?.problemsSolved?.length || 0}
              contestsParticipated={user?.contestsParticipated || 0}
              currentStreak={user?.streak?.current || 0}
              redeemablePoints={Math.floor((user?.points || 0) / 100) * 100}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-primary mb-4">Why Choose TrueCode?</h2>
            <p className="text-xl text-secondary max-w-2xl mx-auto">Everything you need to ace coding interviews and land your dream job</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group card p-8 hover:border-[var(--primary)]/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Bot className="w-7 h-7 text-[var(--primary)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">AI-Powered ChatAI</h3>
              <p className="text-[var(--muted-foreground)]">Get intelligent hints and approach guidance without spoiling the solution.</p>
            </div>

            {/* Feature 2 */}
            <div className="group card p-8 hover:border-[var(--primary)]/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="w-7 h-7 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">Contests & Rewards</h3>
              <p className="text-[var(--muted-foreground)]">Compete weekly, earn points, and redeem exclusive TrueCode merchandise.</p>
            </div>

            {/* Feature 3 */}
            <div className="group card p-8 hover:border-[var(--primary)]/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-7 h-7 text-[var(--primary)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">Company-Wise Filter</h3>
              <p className="text-[var(--muted-foreground)]">Practice problems from Google, Amazon, Microsoft & 100+ companies.</p>
            </div>
          </div>
        </section>

        {/* Achievement Badges Section - separate section below Why Choose TrueCode */}
        <section className="mt-16 mb-20">
          <AchievementBadgesStrip />
        </section>
      </div>

      <Footer />
      <ShowcaseModal isOpen={showShowcase} onClose={() => setShowShowcase(false)} />
    </div>
  );
}
