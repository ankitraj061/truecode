'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ContestProblemRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params?.contestId as string;
  const problemId = params?.problemId as string;

  useEffect(() => {
    if (contestId && problemId) {
      router.replace(`/contests/${contestId}/problem/${problemId}/description`);
    }
  }, [contestId, problemId, router]);

  return (
    <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      <span className="ml-3 text-secondary">Loading...</span>
    </div>
  );
}
