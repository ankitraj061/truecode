'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import FeedbackModal from './Feedback';
import { Mail, Github, Twitter, Linkedin, ExternalLink } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const columns = [
    {
      title: 'Problems',
      links: [
        { label: 'All Problems', href: '/problems' },
        { label: 'Easy', href: '/problems?difficulty=easy' },
        { label: 'Medium', href: '/problems?difficulty=medium' },
        { label: 'Hard', href: '/problems?difficulty=hard' },
      ],
    },
    {
      title: 'Compete',
      links: [
        { label: 'Contests', href: '/contests' },
        { label: 'Redeem Rewards', href: '/redeem' },
        { label: 'Leaderboard', href: '/contests' },
      ],
    },
    {
      title: 'Events',
      links: [
        { label: 'Event Tracker', href: '/calendar' },
        { label: 'Calendar', href: '/calendar' },
      ],
      description: 'Track events from LeetCode, Codeforces, CodeChef & AtCoder',
    },
  ];

  return (
    <>
      <footer className="bg-[var(--card)] text-[var(--muted-foreground)] border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          {/* Top row: brand + columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand column */}
            <div className="lg:col-span-2">
              <Link href="/" className="group inline-flex items-center gap-2 mb-4">
                <Image
                  src="/logo.png"
                  alt="TrueCode"
                  width={320}
                  height={56}
                  className="h-14 w-auto transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
              <p className="text-sm leading-relaxed mb-6 max-w-xs">
                A comprehensive coding platform — practice DSA problems, participate in contests,
                track competitive programming events, and earn real rewards.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/ankitraj061/truecode"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors duration-150"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="https://x.com/AnkitRaj432315"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors duration-150"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://www.linkedin.com/in/ankitraj061/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors duration-150"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="mailto:ankitwithyou.fam@gmail.com"
                  className="p-2 rounded-lg bg-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors duration-150"
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Nav columns */}
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm hover:text-[var(--foreground)] hover:translate-x-0.5 transition-all duration-150 inline-flex items-center gap-1"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                  {col.description && (
                    <li className="text-xs text-[var(--muted-foreground)] pt-1 leading-relaxed">
                      {col.description}
                    </li>
                  )}
                </ul>
              </div>
            ))}

            {/* About column */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Support</h3>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/"
                    className="text-sm hover:text-[var(--foreground)] transition-colors duration-150"
                  >
                    About TrueCode
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setIsFeedbackOpen(true)}
                    className="text-sm hover:text-[var(--foreground)] transition-colors duration-150 text-left"
                  >
                    Give Feedback
                  </button>
                </li>
                <li>
                  <a
                    href="mailto:ankitwithyou.fam@gmail.com"
                    className="text-sm hover:text-[var(--foreground)] transition-colors duration-150 inline-flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--border)] bg-[var(--muted)]/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-[var(--muted-foreground)]">
                © {currentYear} TrueCode. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-xs">
                <a
                  href="https://docs.google.com/document/d/1IvrfysEior3JhqRS2sUCNhTvI4NdKfSUgmrP6G_q6jw/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1"
                >
                  Privacy Policy
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://docs.google.com/document/d/1pMfE1IoO0qoIr04xWExK22wY4qI1ue6NU0q3RH460DA/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1"
                >
                  Terms of Service
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  );
};

export default Footer;
