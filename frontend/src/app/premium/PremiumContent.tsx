"use client";

import { motion, type Variants } from "framer-motion";
import PayButton from "./PayButton";
import { useSelector } from "react-redux";
import { RootState } from "../problems/utils/types";
import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import Footer from "../components/Footer";
import {
  Check, X, Layers, Building2, BookOpen, Star, PlusCircle,
  MessageSquare, Bot, Phone, ShieldCheck, Sparkles, Crown, Zap,
} from "lucide-react";

// ── Animation helpers ─────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = (delay = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: delay } },
});

// ── Feature cards data ────────────────────────────────────────
const featureCards = [
  {
    title: "Premium Problems",
    description: "Access 200+ exclusive problems used in real FAANG interviews",
    gradient: "from-violet-500/10 to-purple-500/5",
    borderColor: "border-violet-500/20",
    icon: Layers,
    iconColor: "text-violet-500",
  },
  {
    title: "Company Filter",
    description: "Filter problems by 50+ top companies: Google, Amazon, Meta, Microsoft & more",
    gradient: "from-blue-500/10 to-cyan-500/5",
    borderColor: "border-blue-500/20",
    icon: Building2,
    iconColor: "text-blue-500",
  },
  {
    title: "Editorial Access",
    description: "Detailed editorials with multiple approaches, complexity analysis & step-by-step explanations",
    gradient: "from-emerald-500/10 to-teal-500/5",
    borderColor: "border-emerald-500/20",
    icon: BookOpen,
    iconColor: "text-emerald-500",
  },
  {
    title: "1.5× Points Multiplier",
    description: "Earn 1.5× TrueCode points on every solve, streak, and contest achievement",
    gradient: "from-amber-500/10 to-orange-500/5",
    borderColor: "border-amber-500/20",
    icon: Star,
    iconColor: "text-amber-500",
  },
  {
    title: "20 Bonus Points",
    description: "Receive 20 bonus points instantly when you activate Premium",
    gradient: "from-pink-500/10 to-rose-500/5",
    borderColor: "border-pink-500/20",
    icon: PlusCircle,
    iconColor: "text-pink-500",
  },
  {
    title: "Higher Discussion Limit",
    description: "Post up to 20 discussions per hour (vs 3 for free users)",
    gradient: "from-indigo-500/10 to-blue-500/5",
    borderColor: "border-indigo-500/20",
    icon: MessageSquare,
    iconColor: "text-indigo-500",
  },
  {
    title: "AI Assistant",
    description: "Unlimited AI hints, solution explanations, and 40 messages of saved chat history per problem (vs 20 for free)",
    gradient: "from-fuchsia-500/10 to-violet-500/5",
    borderColor: "border-fuchsia-500/20",
    icon: Bot,
    iconColor: "text-fuchsia-500",
  },
  {
    title: "Priority Support",
    description: "Get faster response times from the TrueCode team",
    gradient: "from-green-500/10 to-emerald-500/5",
    borderColor: "border-green-500/20",
    icon: Phone,
    iconColor: "text-green-500",
  },
];

const comparisonRows = [
  { feature: "Problems", free: "300+", premium: "500+" },
  { feature: "Company Filter", free: false, premium: true },
  { feature: "Editorial Access", free: false, premium: true },
  { feature: "Discussion / hour", free: "3", premium: "20" },
  { feature: "Points multiplier", free: "1×", premium: "1.5×" },
  { feature: "AI Hints", free: "Limited", premium: "Unlimited" },
  { feature: "Saved Chat History", free: "20 messages", premium: "40 messages" },
  { feature: "Bonus Points", free: "—", premium: "+20 on signup" },
  { feature: "Support", free: "Community", premium: "Priority" },
];

const premiumBenefits = [
  "Access 200+ exclusive premium problems from real FAANG interviews",
  "Filter problems by 50+ top companies including Google, Meta, Amazon",
  "Full editorial access with multiple approaches and complexity analysis",
  "Earn 1.5× TrueCode points on every solve, streak, and contest",
  "20 bonus points credited instantly to your account",
  "Post up to 20 discussions per hour (vs 3 for free users)",
  "Unlimited AI hints and solution explanations via ChatAI",
  "40 messages of saved chat history per problem (vs 20 for free users)",
  "Priority support with faster response times from our team",
];

interface PremiumContentProps {
  /** Render the marketing footer + full-bleed page background. Set false when embedding in a modal. */
  standalone?: boolean;
}

export default function PremiumContent({ standalone = true }: PremiumContentProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const animationFrameRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (user?.subscriptionType === "premium") {
      const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
      const frame = () => {
        if (!endTimeRef.current || Date.now() > endTimeRef.current) {
          endTimeRef.current = Date.now() + 3000;
        }
        confetti({ particleCount: 2, angle: 60, spread: 55, startVelocity: 60, origin: { x: 0, y: 0.5 }, colors });
        confetti({ particleCount: 2, angle: 120, spread: 55, startVelocity: 60, origin: { x: 1, y: 0.5 }, colors });
        animationFrameRef.current = requestAnimationFrame(frame);
      };
      frame();
      return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
    }
  }, [user?.subscriptionType]);

  // ── Premium member view ───────────────────────────────────────
  if (user?.subscriptionType === "premium") {
    return (
      <div className={standalone ? "min-h-screen bg-[var(--background)] relative overflow-hidden" : "relative"}>
        <section className="bg-[var(--card)] border-b border-[var(--border)] rounded-t-2xl">
          <div className="max-w-4xl mx-auto px-6 py-24 text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger(0)}
            >
              <motion.div variants={fadeUp} className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30 mb-2">
                  <Crown className="w-9 h-9 text-yellow-500" />
                </div>
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-4xl lg:text-5xl font-bold text-[var(--foreground)] mb-4">
                You&apos;re a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-purple-500">
                  TrueCode Premium
                </span>{" "}
                member!
              </motion.h1>

              <motion.p variants={fadeUp} className="text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-12">
                Everything is unlocked. Here&apos;s a full look at what you have access to.
              </motion.p>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-3xl mx-auto"
                variants={stagger(0.1)}
              >
                {premiumBenefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="flex items-start gap-3 bg-[var(--secondary)] rounded-xl p-4 border border-[var(--border)] hover:border-[var(--primary)]/40 transition-colors duration-200"
                  >
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[var(--foreground)] text-sm leading-relaxed">{benefit}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>
        {standalone && <Footer />}
      </div>
    );
  }

  // ── Non-premium view ──────────────────────────────────────────
  return (
    <div className={standalone ? "min-h-screen bg-[var(--background)]" : ""}>

      {/* Hero */}
      <section className={`bg-[var(--card)] border-b border-[var(--border)] ${standalone ? "" : "rounded-t-2xl"}`}>
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger()}>
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-full px-4 py-1.5 mb-6">
                <Sparkles className="w-3 h-3" />
                TrueCode Premium
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl lg:text-6xl font-bold text-[var(--foreground)] mb-5 leading-tight">
              Everything you need to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-purple-500">
                land your dream job
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg lg:text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto leading-relaxed">
              Unlock FAANG-level problems, detailed editorials, company filters,
              AI assistance, and more — all in one place.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-[var(--foreground)] mb-3">
            What&apos;s included in Premium
          </h2>
          <p className="text-[var(--muted-foreground)] text-lg max-w-xl mx-auto">
            Every feature designed to take your prep from good to exceptional.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger()}
        >
          {featureCards.map((card, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className={`relative rounded-2xl border bg-gradient-to-br ${card.gradient} ${card.borderColor} p-6 flex flex-col gap-4 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200`}
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center shadow-sm">
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--foreground)] mb-1.5">{card.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Pricing */}
      <section className="bg-[var(--card)] border-y border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-[var(--foreground)] mb-3">
              Simple, transparent pricing
            </h2>
            <p className="text-[var(--muted-foreground)] text-lg">No hidden fees. Cancel anytime.</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger(0.1)}
          >
            {/* Monthly */}
            <motion.div
              variants={fadeUp}
              className="card rounded-2xl p-8 flex flex-col hover:border-[var(--primary)]/40 transition-all duration-200"
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">Monthly</h3>
                <p className="text-[var(--muted-foreground)] text-sm">Flexible — cancel anytime</p>
              </div>
              <div className="flex items-end gap-1.5 mb-6">
                <span className="text-5xl font-bold text-[var(--foreground)]">₹1</span>
                <span className="text-[var(--muted-foreground)] mb-1.5">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {["All 8 premium features", "500+ problems including exclusives", "20 bonus points on activation", "1.5× points multiplier"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--foreground)]">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <PayButton plan="monthly" />
            </motion.div>

            {/* Yearly */}
            <motion.div
              variants={fadeUp}
              className="card rounded-2xl p-8 flex flex-col border-2 border-[var(--primary)] relative hover:shadow-lg hover:shadow-[var(--primary)]/10 transition-all duration-200"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 bg-[var(--primary)] text-white text-xs font-bold tracking-wide uppercase px-4 py-1.5 rounded-full shadow-md">
                  <Zap className="w-3 h-3" />
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">Yearly</h3>
                <p className="text-[var(--muted-foreground)] text-sm">Best value for serious learners</p>
              </div>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-5xl font-bold text-[var(--primary)]">₹6</span>
                <span className="text-[var(--muted-foreground)] mb-1.5">/year</span>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-[var(--muted-foreground)] line-through">₹12</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                  Save 50%
                </span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {["Everything in Monthly", "Locked-in yearly rate", "Extra savings vs monthly billing", "Priority support included"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--foreground)]">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <PayButton plan="yearly" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-[var(--foreground)] mb-3">Free vs Premium</h2>
          <p className="text-[var(--muted-foreground)] text-lg">See exactly what you gain when you upgrade.</p>
        </motion.div>

        <motion.div
          className="rounded-2xl border border-[var(--border)] overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Header */}
          <div className="grid grid-cols-3 bg-[var(--card)] border-b border-[var(--border)]">
            <div className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Feature</div>
            <div className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center border-l border-[var(--border)]">Free</div>
            <div className="px-6 py-4 text-xs font-semibold text-[var(--primary)] uppercase tracking-wider text-center border-l border-[var(--border)]">Premium</div>
          </div>

          {comparisonRows.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-3 border-b border-[var(--border)] last:border-b-0 ${i % 2 === 0 ? "bg-[var(--background)]" : "bg-[var(--card)]"}`}
            >
              <div className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">{row.feature}</div>
              <div className="px-6 py-4 flex items-center justify-center border-l border-[var(--border)]">
                {typeof row.free === "boolean" ? (
                  row.free
                    ? <Check className="w-4 h-4 text-emerald-500" />
                    : <X className="w-4 h-4 text-[var(--muted-foreground)]" />
                ) : (
                  <span className="text-sm text-[var(--muted-foreground)]">{row.free}</span>
                )}
              </div>
              <div className="px-6 py-4 flex items-center justify-center border-l border-[var(--border)]">
                {typeof row.premium === "boolean" ? (
                  row.premium
                    ? <Check className="w-4 h-4 text-emerald-500" />
                    : <X className="w-4 h-4 text-[var(--muted-foreground)]" />
                ) : (
                  <span className="text-sm font-semibold text-[var(--primary)]">{row.premium}</span>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Money-back Guarantee */}
      <section className={`bg-[var(--card)] border-t border-[var(--border)] ${standalone ? "" : "rounded-b-2xl"}`}>
        <motion.div
          className="max-w-2xl mx-auto px-6 py-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3">
            30-Day Money-Back Guarantee
          </h3>
          <p className="text-[var(--muted-foreground)] leading-relaxed">
            Try TrueCode Premium completely risk-free. If you&apos;re not satisfied
            within 30 days of your purchase, we&apos;ll give you a full refund — no questions asked.
          </p>
        </motion.div>
      </section>

      {standalone && <Footer />}
    </div>
  );
}
