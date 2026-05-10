'use client';

import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Footer from './components/Footer';
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import ShowcaseModal from './components/ShowcaseModal';
import { AchievementBadgesStrip } from './components/AchievementBadgesStrip';
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
            color="#60A5FA"
            maxOpacity={0.5}
            flickerChance={0.1}
          />
        </div>

        {/* Animated Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-purple-500/10 animate-gradient-shift z-[1]"></div>
        
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
                  <>Master Coding with <span className="text-transparent bg-clip-text bg-purple-600">AI Power</span></>
                ) : (
                  <>Code. Compete. <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-purple-500">Conquer.</span></>
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
                <div className="flex items-center space-x-2 bg-secondary px-4 py-2 rounded-lg border border-primary">
                  <span className="text-brand">🤖</span>
                  <span className="text-sm font-medium text-primary">AI ChatAI</span>
                </div>
                <div className="flex items-center space-x-2 bg-secondary px-4 py-2 rounded-lg border border-primary">
                  <span className="text-brand">🏆</span>
                  <span className="text-sm font-medium text-primary">Weekly Contests</span>
                </div>
                <div className="flex items-center space-x-2 bg-secondary px-4 py-2 rounded-lg border border-primary">
                  <span className="text-brand">🎁</span>
                  <span className="text-sm font-medium text-primary">Redeem Merch</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/problems" 
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-brand rounded-lg overflow-hidden transition-all hover:scale-105 hover:shadow-lg hover:shadow-brand/50">
                  <span className="relative z-10">
                    {isAuthenticated ? 'Start Solving' : 'Get Started Free'}
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-brand to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <svg className="w-5 h-5 ml-2 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
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
            
            {/* Right Content - Code Editor with Syntax Highlighting */}
            <div className="relative animate-slide-up">
              {/* Floating Elements */}
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-brand/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
              
              <div className="relative card p-8 glass border-2 border-primary hover:border-brand/50 transition-all">
                {/* Window Controls */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-error"></div>
                  <div className="w-3 h-3 rounded-full bg-warning"></div>
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                  <span className="ml-4 text-xs text-secondary font-mono">solution.js</span>
                </div>

                {/* Code Editor with Syntax Highlighting */}
                <div className="bg-secondary rounded-lg p-6 font-mono text-sm leading-relaxed">
                  <div className="text-gray-500 mb-3">{/* Two Sum - Optimal Solution */}</div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-purple-400">function</span>{" "}
                      <span className="text-yellow-300">twoSum</span>
                      <span className="text-gray-300">(</span>
                      <span className="text-orange-300">nums</span>
                      <span className="text-gray-300">, </span>
                      <span className="text-orange-300">target</span>
                      <span className="text-gray-300">) &#123;</span>
                    </div>
                    
                    <div className="ml-4">
                      <span className="text-purple-400">const</span>{" "}
                      <span className="text-blue-300">map</span>
                      <span className="text-gray-300"> = </span>
                      <span className="text-purple-400">new</span>{" "}
                      <span className="text-yellow-300">Map</span>
                      <span className="text-gray-300">();</span>
                    </div>
                    
                    <div className="ml-4">
                      <span className="text-purple-400">for</span>{" "}
                      <span className="text-gray-300">(</span>
                      <span className="text-purple-400">let</span>{" "}
                      <span className="text-blue-300">i</span>
                      <span className="text-gray-300"> = </span>
                      <span className="text-green-400">0</span>
                      <span className="text-gray-300">; i &lt; nums.length; i++) &#123;</span>
                    </div>
                    
                    <div className="ml-8">
                      <span className="text-purple-400">const</span>{" "}
                      <span className="text-blue-300">complement</span>
                      <span className="text-gray-300"> = target - nums[i];</span>
                    </div>
                    
                    <div className="ml-8">
                      <span className="text-purple-400">if</span>{" "}
                      <span className="text-gray-300">(map.</span>
                      <span className="text-yellow-300">has</span>
                      <span className="text-gray-300">(complement)) &#123;</span>
                    </div>
                    
                    <div className="ml-12">
                      <span className="text-purple-400">return</span>{" "}
                      <span className="text-gray-300">[map.</span>
                      <span className="text-yellow-300">get</span>
                      <span className="text-gray-300">(complement), i];</span>
                    </div>
                    
                    <div className="ml-8 text-gray-300">&#125;</div>
                    
                    <div className="ml-8">
                      <span className="text-gray-300">map.</span>
                      <span className="text-yellow-300">set</span>
                      <span className="text-gray-300">(nums[i], i);</span>
                    </div>
                    
                    <div className="ml-4 text-gray-300">&#125;</div>
                    <div className="text-gray-300">&#125;</div>
                  </div>
                  
                  {/* AI Hint Badge */}
                  <div className="mt-4 flex items-start space-x-2 bg-brand/10 border border-brand/30 rounded-lg p-3">
                    <span className="text-brand text-lg">🤖</span>
                    <div className="flex-1">
                      <div className="text-xs text-brand font-semibold mb-1">AI ChatAI Hint</div>
                      <div className="text-xs text-secondary">
                        Use a hash map to store complements for O(n) time complexity...
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Footer */}
                <div className="mt-4 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-4">
                    <span className="text-success">✓ Accepted</span>
                    <span className="text-secondary">Runtime: 68ms</span>
                  </div>
                  <span className="text-tertiary">Beats 94.2%</span>
                </div>
              </div>
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group card p-8 hover:border-brand/50 transition-all hover:scale-105">
              <div className="w-14 h-14 bg-brand/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold text-primary mb-3">AI-Powered ChatAI</h3>
              <p className="text-secondary mb-4">Get intelligent hints and approach guidance without spoiling the solution.</p>
            </div>

            {/* Feature 2 */}
            <div className="group card p-8 hover:border-brand/50 transition-all hover:scale-105">
              <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🏆</span>
              </div>
              <h3 className="text-xl font-bold text-primary mb-3">Contests & Rewards</h3>
              <p className="text-secondary mb-4">Compete weekly, earn points, and redeem exclusive TrueCode merchandise.</p>
            </div>

            {/* Feature 3 */}
            <div className="group card p-8 hover:border-brand/50 transition-all hover:scale-105">
              <div className="w-14 h-14 bg-success/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-primary mb-3">Company-Wise Filter</h3>
              <p className="text-secondary mb-4">Practice problems from Google, Amazon, Microsoft & 100+ companies.</p>
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
