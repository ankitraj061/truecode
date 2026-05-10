'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, checkAuth } from '@/app/slices/authSlice';
import { RootState, AppDispatch } from '@/app/store/store';
import { BorderBeam } from '@/components/ui/border-beam';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface SignupFormData { 
  firstName: string; 
  lastName: string; 
  emailId: string; 
  password: string; 
}

// Define the error payload interface
interface AuthErrorPayload {
  message?: string;
}

export default function SignupPageContent() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { loading, error, isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    emailId: '',
    password: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isInitialized, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoogleSignup = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      const userData: SignupFormData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailId: formData.emailId,
        password: formData.password,
      };

      const result = await dispatch(registerUser(userData));
      
      if (registerUser.rejected.match(result)) {
        const errorPayload = result.payload as AuthErrorPayload | undefined;
        setFormError(errorPayload?.message || 'Registration failed');
      }
    } catch (err) {
      setFormError('An unexpected error occurred');
    }
  };

  // Show loading state while checking authentication
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4"></div>
          <p className="text-secondary">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
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
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-brand to-brand-hover rounded-xl flex items-center justify-center mb-4 shadow-lg hover:scale-110 transition-transform duration-300 hover:rotate-3 cursor-pointer">
            <span className="text-white text-xl font-bold">TC</span>
          </div>
          <h2 className="text-3xl font-bold text-primary bg-gradient-to-r from-brand to-brand-hover bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="mt-2 text-secondary">Join TrueCode to start your coding journey</p>
        </div>

        {/* Card with enhanced effects and BorderBeam */}
        <div className="bg-elevated rounded-xl shadow-2xl p-8 backdrop-blur-sm border border-border-primary/50 hover:shadow-brand/20 transition-all duration-500 animate-fade-in-up relative overflow-hidden">
          
          {/* Google Signup Button with enhanced hover */}
          <button
            onClick={handleGoogleSignup}
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

          {/* Error Messages with animation */}
          {/* {(error || formError) && (
            <div className="mb-4 p-3 bg-error-light border border-error rounded-lg animate-shake">
              <p className="text-error text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {formError || error}
              </p>
            </div>
          )} */}

          {/* Signup Form with enhanced inputs */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label htmlFor="firstName" className="block text-sm font-medium text-primary mb-1 group-focus-within:text-brand transition-colors duration-200">
                  First Name
                </label>
                <div className="relative">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input transition-all duration-300 focus:scale-[1.01] focus:shadow-lg focus:shadow-brand/10 peer"
                    placeholder="John"
                    disabled={loading}
                  />
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-brand to-brand-hover peer-focus:w-full transition-all duration-500"></div>
                </div>
              </div>
              <div className="group">
                <label htmlFor="lastName" className="block text-sm font-medium text-primary mb-1 group-focus-within:text-brand transition-colors duration-200">
                  Last Name
                </label>
                <div className="relative">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input transition-all duration-300 focus:scale-[1.01] focus:shadow-lg focus:shadow-brand/10 peer"
                    placeholder="Doe"
                    disabled={loading}
                  />
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-brand to-brand-hover peer-focus:w-full transition-all duration-500"></div>
                </div>
              </div>
            </div>

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
                  minLength={6}
                  disabled={loading}
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-brand to-brand-hover peer-focus:w-full transition-all duration-500"></div>
              </div>
            </div>

            <div className="group">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary mb-1 group-focus-within:text-brand transition-colors duration-200">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="input transition-all duration-300 focus:scale-[1.01] focus:shadow-lg focus:shadow-brand/10 peer"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-brand to-brand-hover peer-focus:w-full transition-all duration-500"></div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group hover:shadow-lg hover:shadow-brand/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  <span className="animate-pulse">Creating Account...</span>
                </div>
              ) : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Create Account
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
              Already have an account?{' '}
              <Link 
                href="/accounts/login" 
                className="text-brand hover:text-brand-hover font-medium relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-brand-hover hover:after:w-full after:transition-all after:duration-300 inline-block"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-tertiary text-xs">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-brand hover:text-brand-hover relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-brand-hover hover:after:w-full after:transition-all after:duration-300">
                Terms
              </Link> and{' '}
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

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-10px); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          50% { transform: translateY(-30px) translateX(20px) rotate(5deg); }
        }
        
        @keyframes float-slower {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          50% { transform: translateY(20px) translateX(-30px) scale(1.1); }
        }
        
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in-top {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes ping-slow {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes ping-slower {
          75%, 100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 10s ease-in-out infinite; }
        .animate-fade-in-down { animation: fade-in-down 0.6s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out 0.2s backwards; }
        .animate-slide-in-top { animation: slide-in-top 0.4s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-ping-slow { animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-ping-slower { animation: ping-slower 4s cubic-bezier(0, 0, 0.2, 1) infinite; }
      `}</style>
    </div>
  );
}
