'use client';

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ListChecks,
  FilePlus,
  Trophy,
  CalendarPlus,
  Shield,
  LogOut,
  ShoppingCart,
  Users,
  MessageSquare,
} from 'lucide-react';
import type { RootState, AppDispatch } from '@/app/store/store';
import { logoutUser } from '@/app/slices/authSlice';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, isInitialized } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated || !user) {
      router.push('/accounts/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, isInitialized, user, router]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      router.push('/accounts/login');
    } catch (error) {
      // eslint-disable-next-line no-console
    }
  };

  const navItems = [
    { href: '/admin/problems', label: 'Problems', icon: ListChecks },
    { href: '/admin/create-problem', label: 'Create problem', icon: FilePlus },
    { href: '/admin/contests', label: 'Contests', icon: Trophy },
    { href: '/admin/create-contest', label: 'Create contest', icon: CalendarPlus },
    { href: '/admin/create-admins', label: 'Admins', icon: Shield },
    { href: '/admin/redemptions', label: 'Redemptions', icon: ShoppingCart },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  ];

  const isActive = (href: string) => {
    if (pathname === href) return true;
    if (href === '/admin/contests' && pathname?.startsWith('/admin/contests')) return true;
    if (href === '/admin/problems' && pathname?.startsWith('/admin/problems')) return true;
    if (href === '/admin/redemptions' && pathname?.startsWith('/admin/redemptions')) return true;
    if (href === '/admin/users' && pathname?.startsWith('/admin/users')) return true;
    if (href === '/admin/feedback' && pathname?.startsWith('/admin/feedback')) return true;
    return false;
  };

  if (!isInitialized || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="text-center text-secondary text-sm">
          Checking admin access...
        </div>
      </div>
    );
  }

  const displayName =
    user.username?.trim() ||
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
    user.emailId?.split('@')[0] ||
    'Admin';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-primary">
      {/* Fixed sidebar */}
      <aside className="fixed top-0 left-0 z-40 h-screen w-56 md:w-64 bg-elevated border-r border-border-primary flex flex-col">
        <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Image src="/logo.png" alt="TrueCode" width={240} height={48} className="h-12 w-auto" />
            </div>
            <h1 className="text-xl font-bold text-primary">Admin panel</h1>
            <p className="text-xs text-secondary mt-1">
              Configure problems and manage admins.
            </p>
          </div>

          <div className="border-t border-border-primary/70 pt-3">
            <p className="text-xs text-secondary mb-2">Signed in as</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-xs font-semibold text-inverse">
                {avatarInitial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary leading-tight truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-brand font-semibold uppercase tracking-wide">
                  Admin
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 min-h-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                    isActive(item.href)
                      ? 'bg-brand text-white'
                      : 'text-secondary hover:text-primary hover:bg-secondary'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      isActive(item.href) ? 'text-white' : 'text-brand'
                    }`}
                    aria-hidden
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 pt-4 border-t border-border-primary/70">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium bg-error/10 text-error border border-error/40 hover:bg-error/20 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              Log out
            </button>
            <p className="text-[11px] text-tertiary">
              Changes here affect the live platform. Make sure to double-check before
              publishing updates.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content with left offset for fixed sidebar */}
      <div className="pl-56 md:pl-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">
          <main className="space-y-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
