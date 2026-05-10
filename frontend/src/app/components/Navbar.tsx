// components/Navbar.tsx
'use client';

import { ThemeToggle } from '@/app/components/themeToggle';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '@/app/slices/authSlice';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { RootState, AppDispatch } from '@/app/store/store';

// ================= User Type =================
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
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);
  };

  return { ripples, addRipple };
}

// ================= Animated Link Component =================
function AnimatedNavLink({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link 
      href={href} 
      className={`relative group ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></span>
    </Link>
  );
}

// ================= Animated Button Component =================
function AnimatedButton({ 
  href, 
  children, 
  variant = 'primary', 
  onClick 
}: { 
  href?: string; 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}) {
  const { ripples, addRipple } = useRipple();
  
  const baseClasses = "relative overflow-hidden text-sm px-4 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95";
  const variantClasses = variant === 'primary' 
    ? 'bg-brand text-white hover:bg-brand-dark shadow-sm hover:shadow-md'
    : 'bg-secondary text-primary hover:bg-secondary-dark border border-primary';

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    addRipple(e);
    if (onClick) onClick();
  };

  const content = (
    <>
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
          }}
        />
      ))}
    </>
  );

  if (href) {
    return (
      <Link 
        href={href} 
        className={`${baseClasses} ${variantClasses}`}
        onClick={handleClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button 
      className={`${baseClasses} ${variantClasses}`}
      onClick={handleClick}
    >
      {content}
    </button>
  );
}

// ================= Dropdown Component =================
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
    } catch (error) {
    }
  };

  const getInitials = (first: string, last: string) =>
    `${first.charAt(0).toUpperCase()}${last.charAt(0).toUpperCase()}`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center space-x-2 hover:opacity-80 transition-all duration-200 active:scale-95 transform"
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
                user.subscriptionType === 'premium'
                  ? 'border-yellow-400 shadow-md shadow-yellow-500 hover:shadow-lg hover:shadow-yellow-600'
                  : 'border-border-primary hover:border-brand'
              }`}
            />
            {user.subscriptionType === 'premium' && (
              <span className="absolute -top-5 right-1 text-yellow-400 text-lg animate-bounce">👑</span>
            )}
          </div>
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold relative transition-all duration-300 ${
              user.subscriptionType === 'premium'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 border-2 border-yellow-400 hover:shadow-lg hover:shadow-yellow-500'
                : 'bg-brand hover:bg-brand-dark'
            }`}
          >
            {getInitials(user.firstName, user.lastName)}
            {user.subscriptionType === 'premium' && (
              <span className="absolute -top-1 -right-1 text-yellow-400 text-lg animate-bounce">👑</span>
            )}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-elevated border border-primary rounded-lg shadow-lg py-2 z-50 animate-slideDown origin-top">
          <Link
            href={`/${user.username}`}
            className="flex items-center px-4 py-2 text-sm text-primary hover:bg-secondary transition-all duration-200 hover:translate-x-1"
            onClick={() => setIsOpen(false)}
          >
            <svg
              className="w-4 h-4 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <div>
              <p className="font-medium text-primary">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-secondary">@{user.username}</p>
            </div>
          </Link>

          <div className="border-t border-primary my-1" />

          <Link
            href="/my-orders"
            className="flex items-center px-4 py-2 text-sm text-primary hover:bg-secondary transition-all duration-200 hover:translate-x-1"
            onClick={() => setIsOpen(false)}
          >
            <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z" />
            </svg>
            My Orders
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-error hover:bg-secondary transition-all duration-200 hover:translate-x-1"
          >
            <svg
              className="w-4 h-4 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

// ================= Navbar =================
export default function Navbar() {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  return (
    <nav className="bg-elevated/80 backdrop-blur-md border-b border-primary sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="group">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg">
                  <span className="text-inverse font-bold text-sm">TC</span>
                </div>
                <span className="text-xl font-bold transition-colors duration-300 bg-gradient-to-r from-brand to-emerald-400 bg-clip-text text-transparent group-hover:from-emerald-400 group-hover:to-brand">
                  TrueCode
                </span>
              </div>
            </Link>

            <div className="hidden md:flex space-x-6">
              <AnimatedNavLink 
                href="/problems" 
                className="text-primary hover:text-brand transition-colors duration-300"
              >
                Problems
              </AnimatedNavLink>
              <AnimatedNavLink 
                href="/contests" 
                className="text-secondary hover:text-brand transition-colors duration-300"
              >
                Contest
              </AnimatedNavLink>
              <AnimatedNavLink 
                href="/redeem" 
                className="text-secondary hover:text-brand transition-colors duration-300"
              >
                Redeem
              </AnimatedNavLink>
              <AnimatedNavLink 
                href="/events" 
                className="text-secondary hover:text-brand transition-colors duration-300"
              >
                Calendar
              </AnimatedNavLink>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <div className="transition-transform duration-200 hover:scale-110 active:scale-95">
              <ThemeToggle />
            </div>
            {isAuthenticated && user ? (
              <UserProfileDropdown user={user} />
            ) : (
              <>
                <AnimatedButton href="/accounts/login" variant="secondary">
                  Sign In
                </AnimatedButton>
                <AnimatedButton href="/accounts/signup" variant="primary">
                  Sign Up
                </AnimatedButton>
              </>
            )}
            <AnimatedButton
              href="/premium"
              variant="primary"
            >
              {user?.subscriptionType === 'premium'
                ? 'See Premium Features'
                : 'Upgrade to Premium'}
            </AnimatedButton>
          </div>
        </div>
      </div>
    </nav>
  );
}
