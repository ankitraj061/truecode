'use client';

import { Suspense } from 'react';
import LoginPageContent from './Loginpage';

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
