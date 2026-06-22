'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import Footer from './components/Footer';
import ShowcaseModal from './components/ShowcaseModal';
import {
  SlidersHorizontal, GraduationCap, Building2, Code2, Timer,
  Save, FlaskConical, Lightbulb, BarChart3, MessageSquare,
  Bot, Zap, Target, BookOpen, Trophy, Star, Gift, Lock,
  Flame, FileText, Award, ArrowRight, CheckCircle2,
  Sparkles,
} from 'lucide-react';

// ── Framer Motion helpers ──────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const stagger = (delay = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: delay } },
});

function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={stagger()}
    >
      {children}
    </motion.section>
  );
}

function FadeUp({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}

// ── Icon Feature Card ──────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ElementType;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <FadeUp>
      <div className="group card h-full hover:border-[var(--primary)]/40 hover:-translate-y-1 transition-all duration-300">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 ${iconBg}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{description}</p>
      </div>
    </FadeUp>
  );
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({
  value,
  label,
  icon: Icon,
}: {
  value: string;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <FadeUp>
      <div className="group flex flex-col items-center gap-2 bg-[var(--card)]/60 backdrop-blur-sm rounded-2xl px-6 py-5 border border-[var(--border)]/50 hover:border-[var(--primary)]/40 hover:shadow-lg transition-all duration-300">
        <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <span className="text-2xl font-bold text-[var(--primary)]">{value}</span>
        <span className="text-xs text-[var(--muted-foreground)] text-center">{label}</span>
      </div>
    </FadeUp>
  );
}

// ── Section Heading ────────────────────────────────────────────
function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <FadeUp className="text-center mb-14">
      <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">{title}</h2>
      <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">{subtitle}</p>
    </FadeUp>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function HomeWithoutLogin() {
  const [showShowcase, setShowShowcase] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)]">

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[var(--card)]">
        <div className="absolute inset-0 z-0">
          <FlickeringGrid
            className="absolute inset-0 [mask-image:radial-gradient(700px_circle_at_center,white,transparent)]"
            squareSize={4}
            gridGap={6}
            color="#60A5FA"
            maxOpacity={0.4}
            flickerChance={0.1}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-purple-500/5 z-[1]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 z-10">
          <motion.div
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={stagger(0)}
          >
            <FadeUp>
              <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 text-[var(--primary)] px-4 py-1.5 rounded-full text-sm font-medium border border-[var(--primary)]/20 mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI-Powered Coding Platform</span>
              </div>
            </FadeUp>

            <FadeUp delay={0.05}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[var(--foreground)] mb-6 leading-tight tracking-tight">
                Master Coding with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-purple-500">
                  TrueCode
                </span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.1}>
              <p className="text-xl md:text-2xl text-[var(--muted-foreground)] mb-10 max-w-3xl mx-auto leading-relaxed">
                Practice DSA problems, compete in contests, earn points, and redeem exclusive
                rewards — with AI-powered assistance at every step.
              </p>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link
                  href="/accounts/signup"
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-[var(--primary)] rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-xl hover:shadow-[var(--primary)]/30"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start Coding Free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <button
                  type="button"
                  onClick={() => setShowShowcase(true)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-[var(--foreground)] bg-[var(--secondary)] border-2 border-[var(--border)] rounded-xl hover:border-[var(--primary)]/50 transition-all hover:scale-105"
                >
                  <BookOpen className="w-4 h-4" />
                  See How It Works
                </button>
              </div>
            </FadeUp>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
              initial="hidden"
              animate="visible"
              variants={stagger(0.2)}
            >
              <StatCard value="1000+" label="Coding Problems" icon={Code2} />
              <StatCard value="AI" label="Smart Hints" icon={Bot} />
              <StatCard value="Weekly" label="Contests" icon={Trophy} />
              <StatCard value="Merch" label="Redeem Rewards" icon={Gift} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Features: Problem Filtering ───────────────────────── */}
      <Section id="features" className="py-24 bg-[var(--muted)]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading
            title="Advanced Problem Filtering"
            subtitle="Find the perfect problems with powerful filters — difficulty, status, topics, companies, and more."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={SlidersHorizontal}
              iconBg="bg-[var(--primary)]/10 text-[var(--primary)]"
              title="Smart Filters"
              description="Filter by difficulty (Easy, Medium, Hard), status (Solved, Unsolved, Attempted), and problem type (Free, Premium, Saved)."
            />
            <FeatureCard
              icon={GraduationCap}
              iconBg="bg-purple-500/10 text-purple-500"
              title="Topic-Based Learning"
              description="Filter problems by topics like Arrays, Strings, Dynamic Programming, Graphs, Trees, and many more."
            />
            <FeatureCard
              icon={Building2}
              iconBg="bg-amber-500/10 text-amber-500"
              title="Company-Wise Filter"
              description="Premium feature: Practice problems asked by top companies to prepare for your dream job."
            />
          </div>
        </div>
      </Section>

      {/* ── Features: Coding Environment ─────────────────────── */}
      <Section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading
            title="Complete Coding Environment"
            subtitle="Code editor, solutions, submissions, discussions, timer, and auto-save — everything in one place."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
            <FeatureCard
              icon={Code2}
              iconBg="bg-blue-500/10 text-blue-500"
              title="Code Editor"
              description="Multi-language support with syntax highlighting and code formatting."
            />
            <FeatureCard
              icon={Timer}
              iconBg="bg-orange-500/10 text-orange-500"
              title="Built-in Timer"
              description="Track your solving time and improve speed for interviews."
            />
            <FeatureCard
              icon={Save}
              iconBg="bg-[var(--primary)]/10 text-[var(--primary)]"
              title="Auto-Save"
              description="Your code is automatically saved — resume exactly where you left off."
            />
            <FeatureCard
              icon={FlaskConical}
              iconBg="bg-pink-500/10 text-pink-500"
              title="Custom Tests"
              description="Add your own test cases and validate solutions before submitting."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <FeatureCard
              icon={Lightbulb}
              iconBg="bg-yellow-500/10 text-yellow-500"
              title="Solutions Tab"
              description="Learn from multiple solution approaches with detailed explanations."
            />
            <FeatureCard
              icon={BarChart3}
              iconBg="bg-indigo-500/10 text-indigo-500"
              title="Submissions"
              description="View your submission history and track improvement over time."
            />
            <FeatureCard
              icon={MessageSquare}
              iconBg="bg-teal-500/10 text-teal-500"
              title="Discussions"
              description="Engage with the community and share insights on each problem."
            />
          </div>
        </div>
      </Section>

      {/* ── AI Assistant ──────────────────────────────────────── */}
      <Section className="py-24 bg-[var(--muted)]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading
            title="AI-Powered Problem Assistant"
            subtitle="Stuck on a problem? Chat with our AI to get hints and guidance without spoiling the solution."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Bot,
                iconBg: 'bg-[var(--primary)]/10 text-[var(--primary)]',
                title: 'Smart Hints',
                description:
                  'Get contextual hints specific to the problem without revealing the complete solution.',
              },
              {
                icon: Target,
                iconBg: 'bg-amber-500/10 text-amber-500',
                title: 'Approach Guidance',
                description:
                  'Learn different algorithmic approaches and understand the optimal strategy.',
              },
              {
                icon: BookOpen,
                iconBg: 'bg-emerald-500/10 text-emerald-500',
                title: 'Problem-Specific Chat',
                description:
                  'AI assistant has full context of the specific problem for accurate guidance.',
              },
              {
                icon: Zap,
                iconBg: 'bg-pink-500/10 text-pink-500',
                title: 'Instant Help',
                description:
                  'No more waiting — get immediate assistance whenever you are stuck.',
              },
            ].map((item) => (
              <FadeUp key={item.title}>
                <div className="group card flex items-start gap-4 hover:border-[var(--primary)]/40 hover:-translate-y-0.5 transition-all duration-300">
                  <div
                    className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${item.iconBg}`}
                  >
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Contests & Rewards ────────────────────────────────── */}
      <Section id="products" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading
            title="Compete & Earn Rewards"
            subtitle="Participate in contests, earn points, and redeem exclusive TrueCode merchandise."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Trophy}
              iconBg="bg-yellow-500/10 text-yellow-500"
              title="Weekly Contests"
              description="Participate in regular coding contests and compete with developers worldwide to earn points."
            />
            <FeatureCard
              icon={Star}
              iconBg="bg-purple-500/10 text-purple-500"
              title="Points System"
              description="Earn points by solving contest problems — premium users get bonus points for faster progression."
            />
            <FeatureCard
              icon={Gift}
              iconBg="bg-[var(--primary)]/10 text-[var(--primary)]"
              title="Exclusive Merch"
              description="Redeem points for TrueCode merchandise: T-shirts, hoodies, bottles, caps, bags, diaries, and pens."
            />
          </div>
        </div>
      </Section>

      {/* ── Premium Section ───────────────────────────────────── */}
      <Section id="premium" className="py-24 bg-[var(--muted)]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading
            title="Unlock Premium Features"
            subtitle="Get company-wise filters, premium problems, and earn more contest points."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Building2}
              iconBg="bg-blue-500/10 text-blue-500"
              title="Company Filter Access"
              description="Filter problems by companies like Google, Amazon, Microsoft, and more for targeted interview prep."
            />
            <FeatureCard
              icon={Lock}
              iconBg="bg-amber-500/10 text-amber-500"
              title="Premium Problems"
              description="Access exclusive premium problems curated for advanced learning and interview preparation."
            />
            <FeatureCard
              icon={Zap}
              iconBg="bg-[var(--primary)]/10 text-[var(--primary)]"
              title="Bonus Points"
              description="Earn extra points in contests as a premium member to redeem rewards faster."
            />
          </div>
        </div>
      </Section>

      {/* ── Profile & Analytics ───────────────────────────────── */}
      <Section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading
            title="Track Your Progress"
            subtitle="Comprehensive profile with solving stats, heatmaps, submission history, badges, and contest rankings."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard
              icon={BarChart3}
              iconBg="bg-indigo-500/10 text-indigo-500"
              title="Problem Stats"
              description="Track solved problems by difficulty and topic with detailed analytics."
            />
            <FeatureCard
              icon={Flame}
              iconBg="bg-orange-500/10 text-orange-500"
              title="Activity Heatmap"
              description="Visualize your coding consistency with an interactive heatmap."
            />
            <FeatureCard
              icon={FileText}
              iconBg="bg-teal-500/10 text-teal-500"
              title="Recent Submissions"
              description="View your last 10 submissions with status and performance metrics."
            />
            <FeatureCard
              icon={Award}
              iconBg="bg-yellow-500/10 text-yellow-500"
              title="Badges & Rank"
              description="Earn badges and see your contest rating and global rank."
            />
          </div>
        </div>
      </Section>

      {/* ── CTA Section ───────────────────────────────────────── */}
      <Section className="py-24 bg-[var(--card)] border-t border-[var(--border)]">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6">
          <FadeUp>
            <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 text-[var(--primary)] px-4 py-1.5 rounded-full text-sm font-medium border border-[var(--primary)]/20 mb-6">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Free to join, no credit card required
            </div>
          </FadeUp>
          <FadeUp delay={0.05}>
            <h2 className="text-4xl font-bold text-[var(--foreground)] mb-4">
              Ready to Start Your Journey?
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="text-lg text-[var(--muted-foreground)] mb-10">
              Join thousands of developers improving their skills, competing in contests, and
              earning exclusive rewards.
            </p>
          </FadeUp>
          <FadeUp delay={0.15}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/accounts/signup"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-[var(--primary)] rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-xl hover:shadow-[var(--primary)]/30"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Create Free Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/accounts/login"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-[var(--foreground)] bg-[var(--secondary)] border-2 border-[var(--border)] rounded-xl hover:border-[var(--primary)]/50 transition-all hover:scale-105"
              >
                Sign In
              </Link>
            </div>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="text-sm text-[var(--muted-foreground)]">
              No credit card required · Free forever · AI assistance included · Start earning
              rewards today
            </p>
          </FadeUp>
        </div>
      </Section>

      <Footer />
      <ShowcaseModal isOpen={showShowcase} onClose={() => setShowShowcase(false)} />
    </div>
  );
}
