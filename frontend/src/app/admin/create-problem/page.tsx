'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FilePlus, ArrowLeft } from 'lucide-react';
import ProblemForm from '../ProblemForm';

export default function AdminCreateProblemPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <FilePlus className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-primary">Create problem</h2>
          <p className="text-sm text-secondary">
            Add a new coding problem. Fill in the details below.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border-primary bg-elevated/50 p-6">
        <ProblemForm
          editProblem={null}
          onSuccess={() => router.push('/admin/problems')}
          onCancel={() => router.push('/admin/problems')}
        />
      </div>

      <div>
        <Link
          href="/admin/problems"
          className="inline-flex items-center gap-2 text-sm text-brand hover:underline"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back to problems
        </Link>
      </div>
    </div>
  );
}
