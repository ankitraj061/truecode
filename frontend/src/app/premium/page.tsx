"use client";
import PayButton from "./PayButton";
import { useSelector } from "react-redux";
import { RootState } from "../problems/utils/types";
import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import Footer from "../components/Footer";

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-success flex-shrink-0"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CrossIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-error flex-shrink-0"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const featureCards = [
  {
    title: "Premium Problems",
    description:
      "Access 200+ exclusive problems used in real FAANG interviews",
    gradient: "from-violet-500/10 to-purple-500/5",
    borderColor: "border-violet-500/20",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: "Company Filter",
    description:
      "Filter problems by 50+ top companies: Google, Amazon, Meta, Microsoft & more",
    gradient: "from-blue-500/10 to-cyan-500/5",
    borderColor: "border-blue-500/20",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    title: "Editorial Access",
    description:
      "Detailed editorials with multiple approaches, complexity analysis & step-by-step explanations",
    gradient: "from-emerald-500/10 to-teal-500/5",
    borderColor: "border-emerald-500/20",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    title: "1.5× Points Multiplier",
    description:
      "Earn 1.5× TrueCode points on every solve, streak, and contest achievement",
    gradient: "from-amber-500/10 to-orange-500/5",
    borderColor: "border-amber-500/20",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    title: "20 Bonus Points",
    description:
      "Receive 20 bonus points instantly when you activate Premium",
    gradient: "from-pink-500/10 to-rose-500/5",
    borderColor: "border-pink-500/20",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    title: "Higher Discussion Limit",
    description:
      "Post up to 20 discussions per hour (vs 3 for free users)",
    gradient: "from-indigo-500/10 to-blue-500/5",
    borderColor: "border-indigo-500/20",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: "AI Assistant",
    description:
      "Unlimited AI hints and solution explanations via our ChatAI",
    gradient: "from-fuchsia-500/10 to-violet-500/5",
    borderColor: "border-fuchsia-500/20",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand"
      >
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  },
  {
    title: "Priority Support",
    description:
      "Get faster response times from the TrueCode team",
    gradient: "from-green-500/10 to-emerald-500/5",
    borderColor: "border-green-500/20",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.53a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16l.19.92z" />
      </svg>
    ),
  },
];

const comparisonRows = [
  { feature: "Problems", free: "300+", premium: "500+" },
  { feature: "Company Filter", free: false, premium: true },
  { feature: "Editorial Access", free: false, premium: true },
  { feature: "Discussion / hour", free: "3", premium: "20" },
  { feature: "Points multiplier", free: "1×", premium: "1.5×" },
  { feature: "AI Hints", free: "Limited", premium: "Unlimited" },
  { feature: "Bonus Points", free: "—", premium: "+20 on signup" },
  { feature: "Support", free: "Community", premium: "Priority" },
];

export default function PremiumPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const animationFrameRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Continuous side cannons confetti effect
  useEffect(() => {
    if (user?.subscriptionType === "premium") {
      const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

      const frame = () => {
        // Reset end time every 3 seconds to keep it continuous
        if (!endTimeRef.current || Date.now() > endTimeRef.current) {
          endTimeRef.current = Date.now() + 3000; // 3 seconds
        }

        // Fire confetti from both sides
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          startVelocity: 60,
          origin: { x: 0, y: 0.5 },
          colors: colors,
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          startVelocity: 60,
          origin: { x: 1, y: 0.5 },
          colors: colors,
        });

        // Continue the animation
        animationFrameRef.current = requestAnimationFrame(frame);
      };

      // Start the animation
      frame();

      // Cleanup function to stop animation when component unmounts
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [user?.subscriptionType]);

  if (user?.subscriptionType === "premium") {
    return (
      <div className="min-h-screen bg-primary relative overflow-hidden">
        <section className="bg-elevated border-b border-primary">
          <div className="max-w-4xl mx-auto px-6 py-24 text-center">
            <div className="animate-fade-in animate-scale-up">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand/10 border border-brand/30 mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-brand"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-4">
                You&apos;re a{" "}
                <span className="text-brand">TrueCode Premium</span> member!
              </h1>
              <p className="text-xl text-secondary max-w-2xl mx-auto mb-12">
                Everything is unlocked. Here&apos;s a full look at what you have access to.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-3xl mx-auto">
                {[
                  "Access 200+ exclusive premium problems from real FAANG interviews",
                  "Filter problems by 50+ top companies including Google, Meta, Amazon",
                  "Full editorial access with multiple approaches and complexity analysis",
                  "Earn 1.5× TrueCode points on every solve, streak, and contest",
                  "20 bonus points credited instantly to your account",
                  "Post up to 20 discussions per hour (vs 3 for free users)",
                  "Unlimited AI hints and solution explanations via ChatAI",
                  "Priority support with faster response times from our team",
                ].map((benefit, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-secondary rounded-xl p-4 border border-border-primary"
                  >
                    <span className="mt-0.5">
                      <CheckIcon />
                    </span>
                    <span className="text-primary text-sm leading-relaxed">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* Hero Section */}
      <section className="bg-elevated border-b border-primary">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="animate-fade-in">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand bg-brand/10 border border-brand/20 rounded-full px-4 py-1.5 mb-6">
              TrueCode Premium
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold text-primary mb-5 leading-tight">
              Everything you need to{" "}
              <span className="text-brand">land your dream job</span>
            </h1>
            <p className="text-lg lg:text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
              Unlock FAANG-level problems, detailed editorials, company filters,
              AI assistance, and more — all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-3">
            What&apos;s included in Premium
          </h2>
          <p className="text-secondary text-lg max-w-xl mx-auto">
            Every feature designed to take your prep from good to exceptional.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featureCards.map((card, i) => (
            <div
              key={i}
              className={`relative rounded-2xl border bg-gradient-to-br ${card.gradient} ${card.borderColor} p-6 flex flex-col gap-4 hover:scale-[1.02] transition-transform duration-200`}
            >
              <div className="w-12 h-12 rounded-xl bg-elevated border border-border-primary flex items-center justify-center shadow-sm">
                {card.icon}
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary mb-1.5">
                  {card.title}
                </h3>
                <p className="text-sm text-secondary leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-elevated border-y border-primary">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-3">
              Simple, transparent pricing
            </h2>
            <p className="text-secondary text-lg">
              No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Plan */}
            <div className="card rounded-2xl p-8 flex flex-col hover:scale-[1.01] transition-transform duration-200">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-primary mb-1">
                  Monthly
                </h3>
                <p className="text-secondary text-sm">
                  Flexible — cancel anytime
                </p>
              </div>
              <div className="flex items-end gap-1.5 mb-6">
                <span className="text-5xl font-bold text-primary">₹1</span>
                <span className="text-secondary mb-1.5">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "All 8 premium features",
                  "500+ problems including exclusives",
                  "20 bonus points on activation",
                  "1.5× points multiplier",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-primary">
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
              <PayButton plan="monthly" />
            </div>

            {/* Yearly Plan */}
            <div className="card rounded-2xl p-8 flex flex-col border-2 border-brand relative hover:scale-[1.01] transition-transform duration-200">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-brand text-white text-xs font-bold tracking-wide uppercase px-4 py-1.5 rounded-full shadow-md">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-primary mb-1">Yearly</h3>
                <p className="text-secondary text-sm">
                  Best value for serious learners
                </p>
              </div>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-5xl font-bold text-brand">₹6</span>
                <span className="text-secondary mb-1.5">/year</span>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-tertiary line-through">₹12</span>
                <span className="text-xs font-semibold text-success bg-success/10 border border-success/20 rounded-full px-2 py-0.5">
                  Save 50%
                </span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "Everything in Monthly",
                  "Locked-in yearly rate",
                  "Extra savings vs monthly billing",
                  "Priority support included",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-primary">
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
              <PayButton plan="yearly" />
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-3">
            Free vs Premium
          </h2>
          <p className="text-secondary text-lg">
            See exactly what you gain when you upgrade.
          </p>
        </div>

        <div className="rounded-2xl border border-border-primary overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-3 bg-elevated border-b border-border-primary">
            <div className="px-6 py-4 text-sm font-semibold text-secondary uppercase tracking-wide">
              Feature
            </div>
            <div className="px-6 py-4 text-sm font-semibold text-secondary uppercase tracking-wide text-center border-l border-border-primary">
              Free
            </div>
            <div className="px-6 py-4 text-sm font-semibold text-brand uppercase tracking-wide text-center border-l border-border-primary">
              Premium
            </div>
          </div>

          {/* Table Rows */}
          {comparisonRows.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-3 border-b border-border-primary last:border-b-0 ${
                i % 2 === 0 ? "bg-primary" : "bg-elevated/50"
              }`}
            >
              <div className="px-6 py-4 text-sm font-medium text-primary">
                {row.feature}
              </div>
              <div className="px-6 py-4 flex items-center justify-center border-l border-border-primary">
                {typeof row.free === "boolean" ? (
                  row.free ? (
                    <CheckIcon />
                  ) : (
                    <CrossIcon />
                  )
                ) : (
                  <span className="text-sm text-secondary">{row.free}</span>
                )}
              </div>
              <div className="px-6 py-4 flex items-center justify-center border-l border-border-primary">
                {typeof row.premium === "boolean" ? (
                  row.premium ? (
                    <CheckIcon />
                  ) : (
                    <CrossIcon />
                  )
                ) : (
                  <span className="text-sm font-semibold text-brand">
                    {row.premium}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Money-back Guarantee */}
      <section className="bg-elevated border-t border-primary">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 border border-success/20 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-success"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-primary mb-3">
            30-Day Money-Back Guarantee
          </h3>
          <p className="text-secondary leading-relaxed">
            Try TrueCode Premium completely risk-free. If you&apos;re not satisfied
            within 30 days of your purchase, we&apos;ll give you a full refund — no
            questions asked.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
