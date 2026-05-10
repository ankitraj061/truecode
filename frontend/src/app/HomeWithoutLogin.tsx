'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/app/components/themeToggle';
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import Footer from './components/Footer';
import ShowcaseModal from './components/ShowcaseModal';

export default function HomeWithoutLogin() {
  const [showShowcase, setShowShowcase] = useState(false);
  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header className="bg-elevated border-b border-primary sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TC</span>
              </div>
              <span className="text-xl font-bold text-primary">TrueCode</span>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a 
                href="#features" 
                className="text-secondary hover:text-brand transition-colors cursor-pointer"
              >
                Features
              </a>
              <a 
                href="#premium" 
                className="text-secondary hover:text-brand transition-colors cursor-pointer"
              >
                Premium
              </a>
              <a 
                href="#products" 
                className="text-secondary hover:text-brand transition-colors cursor-pointer"
              >
                Rewards
              </a>
            </nav>
            
            {/* Auth & Theme */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/accounts/login" className="btn-secondary">
                Login
              </Link>
              <Link href="/accounts/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with FlickeringGrid */}
      <section className="relative overflow-hidden bg-elevated">
        {/* FlickeringGrid Background */}
        <div className="absolute inset-0 z-0">
          <FlickeringGrid
            className="absolute inset-0 [mask-image:radial-gradient(650px_circle_at_center,white,transparent)]"
            squareSize={4}
            gridGap={6}
            color="#60A5FA"
            maxOpacity={0.5}
            flickerChance={0.1}
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-purple-500/5 z-[1]"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 z-10">
          <div className="animate-fade-in text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-primary mb-6 leading-tight">
              Master Coding with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-purple-500">TrueCode</span>
            </h1>
            <p className="text-xl md:text-2xl text-secondary mb-8 max-w-4xl mx-auto leading-relaxed">
              Practice DSA problems, compete in contests, earn points, and redeem exclusive rewards 
              while preparing for technical interviews with AI-powered assistance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/accounts/signup" className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-brand rounded-lg overflow-hidden transition-all hover:scale-105 hover:shadow-lg hover:shadow-brand/50">
                <span className="relative z-10">Start Coding Free</span>
                <span className="absolute inset-0 bg-gradient-to-r from-brand to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <svg className="w-5 h-5 ml-2 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={() => setShowShowcase(true)}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary bg-secondary border-2 border-primary rounded-lg hover:border-brand/50 transition-all hover:scale-105"
              >
                See How It Works
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center bg-secondary/50 backdrop-blur-sm rounded-xl p-6 border border-primary/30">
                <div className="text-3xl font-bold text-brand mb-2">1000+</div>
                <div className="text-secondary">Coding Problems</div>
              </div>
              <div className="text-center bg-secondary/50 backdrop-blur-sm rounded-xl p-6 border border-primary/30">
                <div className="text-3xl font-bold text-brand mb-2">AI Assistant</div>
                <div className="text-secondary">ChatAI Hints</div>
              </div>
              <div className="text-center bg-secondary/50 backdrop-blur-sm rounded-xl p-6 border border-primary/30">
                <div className="text-3xl font-bold text-brand mb-2">Contests</div>
                <div className="text-secondary">Earn Points</div>
              </div>
              <div className="text-center bg-secondary/50 backdrop-blur-sm rounded-xl p-6 border border-primary/30">
                <div className="text-3xl font-bold text-brand mb-2">Rewards</div>
                <div className="text-secondary">Redeem Products</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Problems Page */}
      <section id="features" className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Advanced Problem Filtering</h2>
            <p className="text-xl text-secondary max-w-3xl mx-auto">
              Find the perfect problems with powerful filters - difficulty, status, topics, companies, and more
            </p>
          </div>



          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="card">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-primary mb-3">Smart Filters</h3>
              <p className="text-secondary">
                Filter by difficulty (Easy, Medium, Hard), status (Solved, Unsolved, Attempted), 
                and problem type (Free, Premium, Saved)
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-primary mb-3">Topic-Based Learning</h3>
              <p className="text-secondary">
                Filter problems by topics like Arrays, Strings, Dynamic Programming, Graphs, Trees, and more
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-primary mb-3">Company-Wise Filter</h3>
              <p className="text-secondary">
                Premium feature: Practice problems asked by top companies to prepare for your dream job
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Solving Experience */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Complete Coding Environment</h2>
            <p className="text-xl text-secondary max-w-3xl mx-auto">
              Code editor, solutions, submissions, discussions, timer, and auto-save - everything you need in one place
            </p>
          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <div className="card text-center">
              <div className="text-3xl mb-3">💻</div>
              <h3 className="text-lg font-semibold text-primary mb-2">Code Editor</h3>
              <p className="text-sm text-secondary">
                Multi-language support with syntax highlighting and code formatting
              </p>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-3">⏱️</div>
              <h3 className="text-lg font-semibold text-primary mb-2">Built-in Timer</h3>
              <p className="text-sm text-secondary">
                Track your solving time and improve speed for interviews
              </p>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-3">💾</div>
              <h3 className="text-lg font-semibold text-primary mb-2">Auto-Save</h3>
              <p className="text-sm text-secondary">
                Your code is automatically saved - resume exactly where you left off
              </p>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-3">🧪</div>
              <h3 className="text-lg font-semibold text-primary mb-2">Custom Tests</h3>
              <p className="text-sm text-secondary">
                Add your own test cases and validate solutions before submitting
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="card text-center">
              <div className="text-3xl mb-3">💡</div>
              <h3 className="text-lg font-semibold text-primary mb-2">Solutions Tab</h3>
              <p className="text-sm text-secondary">
                Learn from multiple solution approaches with detailed explanations
              </p>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-primary mb-2">Submissions</h3>
              <p className="text-sm text-secondary">
                View your submission history and track improvement over time
              </p>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="text-lg font-semibold text-primary mb-2">Discussions</h3>
              <p className="text-sm text-secondary">
                Engage with the community and share insights on each problem
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ChatAI Feature */}
      <section className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">
              AI-Powered Problem Assistant
            </h2>
            <p className="text-xl text-secondary max-w-3xl mx-auto">
              Stuck on a problem? Chat with our AI to get hints, approaches, and guidance without spoiling the solution
            </p>
          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="card">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-brand rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-2">Smart Hints</h3>
                  <p className="text-secondary">
                    Get contextual hints specific to the problem you&apos;re solving without revealing the complete solution
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-2">Approach Guidance</h3>
                  <p className="text-secondary">
                    Learn different algorithmic approaches and understand the optimal strategy for each problem
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">📖</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-2">Problem-Specific Chat</h3>
                  <p className="text-secondary">
                    AI assistant has context of the specific problem you&apos;re working on for accurate guidance
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-error rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-2">Instant Help</h3>
                  <p className="text-secondary">
                    No more waiting - get immediate assistance whenever you&apos;re stuck on any part of the problem
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contests & Rewards */}
      <section id="products" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Compete & Earn Rewards</h2>
            <p className="text-xl text-secondary max-w-3xl mx-auto">
              Participate in contests, earn points, and redeem exclusive TrueCode merchandise
            </p>
          </div>



          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="card interactive">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-primary mb-3">Weekly Contests</h3>
              <p className="text-secondary mb-4">
                Participate in regular coding contests and compete with developers worldwide to earn points
              </p>
            </div>

            <div className="card interactive">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold text-primary mb-3">Points System</h3>
              <p className="text-secondary mb-4">
                Earn points by solving contest problems - premium users get bonus points for faster progression
              </p>
            </div>

            <div className="card interactive">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-semibold text-primary mb-3">Exclusive Merch</h3>
              <p className="text-secondary mb-4">
                Redeem points for TrueCode merchandise: T-shirts, hoodies, bottles, caps, bags, diaries, and pens
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Section */}
      <section id="premium" className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Unlock Premium Features
            </h2>
            <p className="text-xl text-secondary max-w-3xl mx-auto">
              Get access to company-wise filters, premium problems, and earn more contest points
            </p>
          </div>



          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="card">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-primary mb-3">Company Filter Access</h3>
              <p className="text-secondary">
                Filter problems by companies like Google, Amazon, Microsoft, and more for targeted interview prep
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-primary mb-3">Premium Problems</h3>
              <p className="text-secondary">
                Access exclusive premium problems curated for advanced learning and interview preparation
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-primary mb-3">Bonus Points</h3>
              <p className="text-secondary">
                Earn extra points in contests as a premium member to redeem rewards faster
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Profile & Analytics */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Track Your Progress</h2>
            <p className="text-xl text-secondary max-w-3xl mx-auto">
              Comprehensive profile with solving stats, heatmaps, submission history, badges, and contest rankings
            </p>
          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <div className="card text-center">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-primary mb-2">Problem Stats</h3>
              <p className="text-sm text-secondary">
                Track solved problems by difficulty and topic with detailed analytics
              </p>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-3">🔥</div>
              <h3 className="text-lg font-semibold text-primary mb-2">Activity Heatmap</h3>
              <p className="text-sm text-secondary">
                Visualize your coding consistency with an interactive heatmap
              </p>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="text-lg font-semibold text-primary mb-2">Recent Submissions</h3>
              <p className="text-sm text-secondary">
                View your last 10 submissions with status and performance metrics
              </p>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-3">🏅</div>
              <h3 className="text-lg font-semibold text-primary mb-2">Badges & Rank</h3>
              <p className="text-sm text-secondary">
                Earn badges and see your contest rating and global rank
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold text-primary mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl text-secondary mb-8">
            Join thousands of developers improving their skills, competing in contests, and earning exclusive rewards
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/accounts/signup" className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-brand rounded-lg overflow-hidden transition-all hover:scale-105 hover:shadow-lg hover:shadow-brand/50">
              <span className="relative z-10">Create Free Account</span>
              <span className="absolute inset-0 bg-gradient-to-r from-brand to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </Link>
            <Link href="/accounts/login" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-primary bg-secondary border-2 border-primary rounded-lg hover:border-brand/50 transition-all hover:scale-105">
              Sign In
            </Link>
          </div>

          <p className="text-tertiary text-sm">
            No credit card required • Free forever • AI assistance included • Start earning rewards today
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      <ShowcaseModal isOpen={showShowcase} onClose={() => setShowShowcase(false)} />
    </div>
  );
}
