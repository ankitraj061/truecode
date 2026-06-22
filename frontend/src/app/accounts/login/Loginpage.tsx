'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { loginUser } from '@/app/slices/authSlice';
import { RootState, AppDispatch } from '@/app/store/store';
import { BorderBeam } from '@/components/ui/border-beam';
import Footer from '@/app/components/Footer';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function LoginPageContent() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading, isAuthenticated, isInitialized, user } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    emailId: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRedirectTarget = (role?: string) => {
    if (role === 'admin') return '/admin';
    const redirect = searchParams.get('redirect');
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return redirect;
    }
    return '/';
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.push(getRedirectTarget(user?.role));
    }
  }, [isAuthenticated, isInitialized, user, router, searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoogleLogin = () => {
    const redirect = searchParams.get('redirect');
    const query = redirect && redirect.startsWith('/') && !redirect.startsWith('//')
      ? `?redirect=${encodeURIComponent(redirect)}`
      : '';
    window.location.href = `${BACKEND_URL}/api/auth/google${query}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const credentials = {
        emailId: formData.emailId,
        password: formData.password,
      };

      const result = await dispatch(loginUser(credentials));

      if (loginUser.fulfilled.match(result)) {
        const loggedInUser = result.payload as RootState['auth']['user'];
        router.push(getRedirectTarget(loggedInUser?.role));
      } else if (loginUser.rejected.match(result)) {
        const message =
          typeof result.payload === 'string'
            ? result.payload
            : (result.payload && typeof (result.payload as { error?: string }).error === 'string'
                ? (result.payload as { error?: string }).error || 'Login failed'
                : 'Login failed');
        toast.error(message);
        setIsSubmitting(false);
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand/5 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand/10 rounded-full blur-3xl animate-float-slower"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-brand/5 rounded-full blur-3xl animate-float"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Header with enhanced animation */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="mx-auto w-12 h-12 bg-brand rounded-xl flex items-center justify-center mb-4 shadow-lg hover:scale-110 transition-transform duration-300 hover:rotate-3 cursor-pointer">
            <span className="text-white text-xl font-bold">TC</span>
          </div>
          <h2 className="text-3xl font-bold text-primary bg-gradient-to-r from-brand to-brand-hover bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="mt-2 text-secondary">Sign in to your TrueCode account</p>
        </div>

        {/* Success Message with animation */}
        {searchParams.get('signup') === 'success' && (
          <div className="mb-6 p-4 bg-success-light border border-success rounded-lg animate-slide-in-top">
            <p className="text-success font-medium text-center flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Account created successfully! Please sign in.
            </p>
          </div>
        )}

        {/* Card with enhanced effects and BorderBeam */}
        <div className="bg-elevated rounded-xl shadow-2xl p-8 backdrop-blur-sm border border-border-primary/50 hover:shadow-brand/20 transition-all duration-500 animate-fade-in-up relative overflow-hidden">
          
          {/* Google Login Button with enhanced hover */}
          <button
            onClick={handleGoogleLogin}
            className="w-full btn-secondary mb-6 flex items-center justify-center space-x-3 py-3 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden"
            disabled={loading}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <svg className="w-5 h-5 group-hover:rotate-[360deg] transition-transform duration-700" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-primary font-medium relative z-10">Continue with Google</span>
          </button>

          {/* Animated Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-primary relative">
              <div className="absolute inset-0 border-t border-brand/20 animate-pulse"></div>
            </div>
            <span className="mx-4 text-tertiary text-sm font-medium">or</span>
            <div className="flex-1 border-t border-primary relative">
              <div className="absolute inset-0 border-t border-brand/20 animate-pulse"></div>
            </div>
          </div>

          {/* Login Form with enhanced inputs */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="group">
              <label htmlFor="emailId" className="block text-sm font-medium text-primary mb-1 group-focus-within:text-brand transition-colors duration-200">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="emailId"
                  name="emailId"
                  type="email"
                  required
                  value={formData.emailId}
                  onChange={handleInputChange}
                  className="input transition-all duration-300 focus:scale-[1.01] focus:shadow-lg focus:shadow-brand/10 peer"
                  placeholder="john@example.com"
                  disabled={loading}
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-brand to-brand-hover peer-focus:w-full transition-all duration-500"></div>
              </div>
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm font-medium text-primary mb-1 group-focus-within:text-brand transition-colors duration-200">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input transition-all duration-300 focus:scale-[1.01] focus:shadow-lg focus:shadow-brand/10 peer"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-brand to-brand-hover peer-focus:w-full transition-all duration-500"></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center group cursor-pointer">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-brand focus:ring-brand border-border-primary rounded cursor-pointer transition-all duration-200 hover:scale-110"
                  disabled={loading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary group-hover:text-primary transition-colors duration-200 cursor-pointer">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link 
                  href="/accounts/forgot-password" 
                  className="text-brand hover:text-brand-hover font-medium relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-brand-hover hover:after:w-full after:transition-all after:duration-300"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group hover:shadow-lg hover:shadow-brand/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {(loading || isSubmitting) ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  <span className="animate-pulse">Signing In...</span>
                </div>
              ) : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Sign In
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Footer with hover effect */}
          <div className="mt-6 text-center">
            <p className="text-secondary text-sm">
              Don&apos;t have an account?{' '}
              <Link
                href="/accounts/signup"
                className="text-brand hover:text-brand-hover font-medium relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-brand-hover hover:after:w-full after:transition-all after:duration-300 inline-block"
              >
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-tertiary text-xs">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-brand hover:text-brand-hover relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-brand-hover hover:after:w-full after:transition-all after:duration-300">
                Terms
              </Link>{' '}and{' '}
              <Link href="/privacy" className="text-brand hover:text-brand-hover relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-brand-hover hover:after:w-full after:transition-all after:duration-300">
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* BorderBeam - Add this at the end of the card */}
          <BorderBeam 
            size={150} 
            duration={12} 
            delay={0}
          />
        </div>

        {/* Decorative particles */}
        <div className="absolute -top-4 -right-4 w-20 h-20 border border-brand/20 rounded-full animate-ping-slow opacity-20"></div>
        <div className="absolute -bottom-4 -left-4 w-16 h-16 border border-brand/20 rounded-full animate-ping-slower opacity-20"></div>
      </div>

    </div>
    <Footer />
    </>
  );
}
