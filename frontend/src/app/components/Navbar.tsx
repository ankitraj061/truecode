// components/Navbar.tsx
'use client';

import { ThemeToggle } from '@/app/components/themeToggle';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '@/app/slices/authSlice';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { RootState, AppDispatch } from '@/app/store/store';
import {
  User, ShoppingBag, LogOut, Menu, X, Code2,
  Trophy, BookOpen, Gift, Calendar, Crown, Sparkles,
} from 'lucide-react';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  emailId: string;
  role: string;
  username: string;
  subscriptionType?: 'free' | 'premium';
  profilePicture?: string;
  theme: string;
}

// ================= Ripple Effect Hook =================
function useRipple() {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const addRipple = (event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  return { ripples, addRipple };
}

// ================= Animated Nav Link =================
function AnimatedNavLink({
  href,
  children,
  className = '',
  onClick,
  isActive = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative group ${className} ${isActive ? 'text-[var(--primary)]' : ''}`}
      onClick={onClick}
    >
      <span className="relative z-10">{children}</span>
      <span
        className={`absolute inset-x-0 bottom-0 h-0.5 bg-[var(--primary)] rounded-full transition-transform duration-300 ease-out origin-left ${
          isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
        }`}
      />
    </Link>
  );
}

// ================= Animated Button =================
function AnimatedButton({
  href,
  children,
  variant = 'primary',
  onClick,
}: {
  href?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}) {
  const { ripples, addRipple } = useRipple();

  const baseClasses =
    'relative overflow-hidden text-sm px-4 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95 inline-flex items-center gap-1.5';
  const variantClasses =
    variant === 'primary'
      ? 'bg-[var(--primary)] text-white hover:opacity-90 shadow-sm hover:shadow-md'
      : 'bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)] border border-[var(--border)]';

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    addRipple(e);
    if (onClick) onClick();
  };

  const rippleEls = ripples.map((r) => (
    <span
      key={r.id}
      className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
      style={{ left: r.x, top: r.y, width: 0, height: 0 }}
    />
  ));

  if (href) {
    return (
      <Link href={href} className={`${baseClasses} ${variantClasses}`} onClick={handleClick}>
        {children}
        {rippleEls}
      </Link>
    );
  }

  return (
    <button className={`${baseClasses} ${variantClasses}`} onClick={handleClick}>
      {children}
      {rippleEls}
    </button>
  );
}

// ================= User Profile Dropdown =================
function UserProfileDropdown({ user }: { user: User }) {
  const dispatch = useDispatch<AppDispatch>();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      router.push('/');
    } catch {}
  };

  const getInitials = (first: string, last: string) =>
    `${first.charAt(0).toUpperCase()}${last.charAt(0).toUpperCase()}`;

  const isPremium = user.subscriptionType === 'premium';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center space-x-2 hover:opacity-80 transition-all duration-200 active:scale-95"
        aria-expanded={isOpen}
      >
        {user.profilePicture ? (
          <div className="relative">
            <Image
              src={user.profilePicture}
              alt={`${user.firstName} ${user.lastName}`}
              width={32}
              height={32}
              className={`rounded-full border-2 transition-all duration-300 ${
                isPremium
                  ? 'border-yellow-400 shadow-md shadow-yellow-500/50 hover:shadow-lg hover:shadow-yellow-600/50'
                  : 'border-[var(--border)] hover:border-[var(--primary)]'
              }`}
            />
            {isPremium && (
              <Crown className="absolute -top-2 right-0 w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            )}
          </div>
        ) : (
          <div className="relative">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-all duration-300 ${
                isPremium
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-yellow-400 hover:shadow-lg hover:shadow-yellow-500/50'
                  : 'bg-[var(--primary)] hover:opacity-90'
              }`}
            >
              {getInitials(user.firstName, user.lastName)}
            </div>
            {isPremium && (
              <Crown className="absolute -top-2 -right-1 w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            )}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl py-1.5 z-50 animate-slideDown origin-top-right">
          {/* User info header */}
          <div className="px-4 py-2.5 border-b border-[var(--border)]">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] truncate">@{user.username}</p>
          </div>

          <Link
            href={`/${user.username}`}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors duration-150"
            onClick={() => setIsOpen(false)}
          >
            <User className="w-4 h-4 text-[var(--muted-foreground)]" />
            My Profile
          </Link>

          <Link
            href="/my-orders"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors duration-150"
            onClick={() => setIsOpen(false)}
          >
            <ShoppingBag className="w-4 h-4 text-[var(--muted-foreground)]" />
            My Orders
          </Link>

          <div className="border-t border-[var(--border)] my-1" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--destructive)] hover:bg-[var(--muted)] transition-colors duration-150"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// ================= Mobile Nav Drawer =================
function MobileNavDrawer({
  isOpen,
  onClose,
  isAuthenticated,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  user: User | null;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      onClose();
      router.push('/');
    } catch {}
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const navLinks = [
    { href: '/problems', label: 'Problems', icon: BookOpen },
    { href: '/contests', label: 'Contest', icon: Trophy },
    { href: '/redeem', label: 'Redeem', icon: Gift },
    { href: '/events', label: 'Calendar', icon: Calendar },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-[var(--card)] border-l border-[var(--border)] shadow-2xl z-50 transform transition-transform duration-300 ease-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[var(--primary)] rounded-lg flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[var(--foreground)]">TrueCode</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--muted-foreground)]" />
          </button>
        </div>

        {/* User info (if logged in) */}
        {isAuthenticated && user && (
          <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--muted)]/50">
            <p className="font-semibold text-[var(--foreground)]">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">@{user.username}</p>
          </div>
        )}

        {/* Nav links */}
        <nav className="px-3 py-4 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-150 ${
                  active
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                    : 'text-[var(--foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)]'
                }`}
                onClick={onClose}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[var(--primary)]' : ''}`} />
                {label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-6 border-t border-[var(--border)] space-y-3">
          {isAuthenticated && user ? (
            <>
              <Link
                href="/premium"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[var(--primary)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-4 h-4" />
                {user.subscriptionType === 'premium' ? 'Premium Features' : 'Upgrade to Premium'}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-[var(--destructive)]/50 text-[var(--destructive)] font-medium text-sm hover:bg-[var(--destructive)]/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/accounts/login"
                onClick={onClose}
                className="flex items-center justify-center w-full py-2.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] font-medium text-sm hover:bg-[var(--muted)] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/accounts/signup"
                onClick={onClose}
                className="flex items-center justify-center w-full py-2.5 rounded-lg bg-[var(--primary)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Sign Up Free
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ================= Navbar =================
export default function Navbar() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/problems', label: 'Problems', icon: BookOpen },
    { href: '/contests', label: 'Contest', icon: Trophy },
    { href: '/redeem', label: 'Redeem', icon: Gift },
    { href: '/events', label: 'Calendar', icon: Calendar },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <nav className="bg-[var(--card)]/80 backdrop-blur-md border-b border-[var(--border)] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Left Section */}
            <div className="flex items-center gap-8">
              <Link href="/" className="group flex items-center gap-2">
                <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg">
                  <Code2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-[var(--primary)] to-emerald-400 bg-clip-text text-transparent group-hover:from-emerald-400 group-hover:to-[var(--primary)] transition-all duration-300">
                  TrueCode
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                {navLinks.map(({ href, label }) => {
                  const active = isActive(href);
                  return (
                    <AnimatedNavLink
                      key={href}
                      href={href}
                      isActive={active}
                      className={`text-sm font-medium transition-colors duration-200 ${
                        active
                          ? 'text-[var(--primary)] font-semibold'
                          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      {label}
                    </AnimatedNavLink>
                  );
                })}
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <div className="transition-transform duration-200 hover:scale-110 active:scale-95">
                <ThemeToggle />
              </div>

              {/* Desktop auth */}
              <div className="hidden md:flex items-center gap-3">
                {isAuthenticated && user ? (
                  <>
                    <AnimatedButton href="/premium" variant="primary">
                      <Sparkles className="w-3.5 h-3.5" />
                      {user.subscriptionType === 'premium' ? 'Premium' : 'Upgrade'}
                    </AnimatedButton>
                    <UserProfileDropdown user={user} />
                  </>
                ) : (
                  <>
                    <AnimatedButton href="/accounts/login" variant="secondary">
                      Sign In
                    </AnimatedButton>
                    <AnimatedButton href="/accounts/signup" variant="primary">
                      Sign Up Free
                    </AnimatedButton>
                  </>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-[var(--muted)] transition-colors duration-150"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-[var(--foreground)]" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <MobileNavDrawer
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user}
      />
    </>
  );
}
