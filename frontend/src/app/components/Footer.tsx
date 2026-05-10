'use client';
import Link from 'next/link';
import { useState } from 'react';
import FeedbackModal from './Feedback';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <>
      <footer className="bg-elevated text-secondary border-t border-primary">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Column 1: Problems */}
            <div>
              <h3 className="text-primary font-semibold text-lg mb-4">Problems</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/problems" className="hover:text-primary transition-colors">
                    All Problems
                  </Link>
                </li>
                <li>
                  <Link href="/problems?difficulty=easy" className="hover:text-primary transition-colors">
                    Easy
                  </Link>
                </li>
                <li>
                  <Link href="/problems?difficulty=medium" className="hover:text-primary transition-colors">
                    Medium
                  </Link>
                </li>
                <li>
                  <Link href="/problems?difficulty=hard" className="hover:text-primary transition-colors">
                    Hard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Contests & Redeem */}
            <div>
              <h3 className="text-primary font-semibold text-lg mb-4">Compete</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/contests" className="hover:text-primary transition-colors">
                    Contests
                  </Link>
                </li>
                <li>
                  <Link href="/redeem" className="hover:text-primary transition-colors">
                    Redeem
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Track Events */}
            <div>
              <h3 className="text-primary font-semibold text-lg mb-4">Events</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/events" className="hover:text-primary transition-colors">
                    Event Tracker
                  </Link>
                </li>
                <li>
                  <Link href="/events" className="hover:text-primary transition-colors">
                    Calendar
                  </Link>
                </li>
                <li>
                  <p className="text-sm text-muted">
                    Track events from LeetCode, Codeforces, CodeChef & AtCoder
                  </p>
                </li>
              </ul>
            </div>

            {/* Column 4: About */}
            <div>
              <h3 className="text-primary font-semibold text-lg mb-4">About</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="hover:text-primary transition-colors">
                    About TrueCode
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setIsFeedbackOpen(true)}
                    className="hover:text-primary transition-colors text-left"
                  >
                    Feedback
                  </button>
                </li>
                <li>
                  <a 
                    href="mailto:ankitwithyou.fam@gmail.com" 
                    className="hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                      />
                    </svg>
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Description Section */}
          <div className="mt-8 pt-8 border-t border-primary">
            <p className="text-muted text-sm max-w-3xl">
              TrueCode is a comprehensive coding platform where you can practice DSA problems, 
              participate in contests, see your global rank, and track competitive programming 
              events from platforms like LeetCode, Codeforces, CodeChef, and AtCoder.
            </p>
          </div>
        </div>

        {/* Bottom Bar - Copyright */}
        <div className="bg-secondary border-t border-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-muted text-sm text-center md:text-left">
                © {currentYear} TrueCode. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm">
                <a 
                  href="https://docs.google.com/document/d/1IvrfysEior3JhqRS2sUCNhTvI4NdKfSUgmrP6G_q6jw/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Privacy Policy
                </a>
                <a 
                  href="https://docs.google.com/document/d/1pMfE1IoO0qoIr04xWExK22wY4qI1ue6NU0q3RH460DA/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />
    </>
  );
};

export default Footer;
