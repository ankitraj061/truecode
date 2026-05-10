'use client';

import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="max-w-md w-full rounded-xl border border-primary bg-elevated p-8 text-center">
        <h1 className="text-2xl font-semibold text-primary mb-3">Forgot Password</h1>
        <p className="text-secondary mb-6">
          Password reset is not available yet. Please contact support or use Google sign in.
        </p>
        <Link href="/accounts/login" className="btn-primary inline-block px-4 py-2">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
