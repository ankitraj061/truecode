'use client';

import React from 'react';
import { Zap, Target, TrendingUp, X } from 'lucide-react';

interface ShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShowcaseModal({ isOpen, onClose }: ShowcaseModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="How TrueCode helps you level up"
    >
      <div className="relative max-w-2xl w-full bg-primary border-[5px] border-border-primary rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Accent corner */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-brand to-purple-500 rotate-45 opacity-60 pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-border-primary flex items-center justify-between bg-elevated/90 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-error mr-1" />
            <span className="w-2 h-2 rounded-full bg-warning mr-1" />
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="ml-3 text-xs font-mono text-secondary">truecode/intro.modal</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-secondary hover:text-primary text-sm font-semibold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4 bg-primary relative z-10">
          <div>
            <h2 className="text-xl font-bold text-primary mb-1">
              How TrueCode helps you level up
            </h2>
            <p className="text-sm text-secondary">
              A focused flow from practice &amp; contests to real interview confidence.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <div className="rounded-xl border border-border-primary bg-elevated p-4 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand/15 flex items-center justify-center text-brand">
                <Target size={18} />
              </div>
              <h3 className="text-sm font-semibold text-primary">Guided practice</h3>
              <p className="text-xs text-secondary">
                Topic‑wise problems with filters and hints so you always know what to do next.
              </p>
            </div>

            <div className="rounded-xl border border-border-primary bg-elevated p-4 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-300">
                <Zap size={18} />
              </div>
              <h3 className="text-sm font-semibold text-primary">Contest pressure</h3>
              <p className="text-xs text-secondary">
                Timed contests with scores &amp; penalties—just like real interviews.
              </p>
            </div>

            <div className="rounded-xl border border-border-primary bg-elevated p-4 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center text-success">
                <TrendingUp size={18} />
              </div>
              <h3 className="text-sm font-semibold text-primary">Progress you can see</h3>
              <p className="text-xs text-secondary">
                Profile analytics, streaks, and submissions that make growth obvious.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border-primary bg-elevated/90 flex items-center justify-between text-xs text-secondary">
          <span>Tip: Start with easy problems, then mix in 1–2 mediums per day.</span>
          <span className="text-brand font-semibold">Code. Compete. Conquer.</span>
        </div>
      </div>
    </div>
  );
}

