'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, CalendarPlus, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { AdminAPI, type AdminContestsListResponse } from '@/app/admin/utils/adminAPI';
import Loader from '@/app/components/TruckLoader';

function formatDate(s: string) {
  return new Date(s).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AdminContestsListPage() {
  const router = useRouter();
  const [res, setRes] = useState<AdminContestsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const loadContests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminAPI.getAdminContests({ page: 1, limit: 50 });
      setRes(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to load contests';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContests();
  }, [loadContests]);

  const handleDelete = async (contestId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this contest? This cannot be undone.');
    if (!confirmed) return;
    setOpenMenuId(null);
    try {
      await AdminAPI.deleteContest(contestId);
      await loadContests();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to delete contest';
      setError(msg);
    }
  };

  const contests = res?.contests ?? [];
  const total = res?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Trophy className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-primary">Contests</h2>
            <p className="text-sm text-secondary">
              Create and manage contests. Only inactive problems can be added.
            </p>
          </div>
        </div>
        <Link
          href="/admin/create-contest"
          className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden />
          Create contest
        </Link>
      </div>

      <div className="card bg-elevated border border-border-primary">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-primary">Contests list</h3>
          <p className="text-xs text-secondary">
            Showing {contests.length} of {total}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-error/50 bg-error/10 px-4 py-3 text-sm text-error mb-3">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border-primary text-left">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Start</th>
                <th className="py-2 pr-4">End</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Participants</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8">
                    <div className="flex flex-col items-center justify-center py-6">
                      <Loader message="Loading contests" submessage="Fetching admin contests..." />
                    </div>
                  </td>
                </tr>
              ) : contests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-secondary">
                    No contests yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                contests.map((c) => (
                  <tr key={c._id} className="border-t border-border-primary">
                    <td className="py-2 pr-4 max-w-xs">
                      <p className="font-medium text-primary truncate" title={c.title}>
                        {c.title}
                      </p>
                    </td>
                    <td className="py-2 pr-4 text-secondary">
                      {formatDate(c.startTime)}
                    </td>
                    <td className="py-2 pr-4 text-secondary">
                      {formatDate(c.endTime)}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.status === 'upcoming'
                            ? 'bg-slate-500/10 text-slate-400'
                            : c.status === 'running'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-secondary capitalize">
                      {c.type}
                    </td>
                    <td className="py-2 pr-4 text-secondary">
                      {c.participantCount ?? 0}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId((id) => (id === c._id ? null : c._id))}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border-primary bg-transparent text-secondary hover:bg-secondary/40 hover:text-primary"
                        >
                          <span className="sr-only">Open actions</span>
                          <MoreVertical className="h-4 w-4" aria-hidden />
                        </button>
                        {openMenuId === c._id && (
                          <div className="absolute right-0 z-10 mt-1 w-40 origin-top-right rounded-md border border-border-primary bg-elevated py-1 text-left shadow-lg">
                            <Link
                              href={`/admin/contests/${c._id}/edit`}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-brand hover:bg-secondary/60"
                              onClick={() => setOpenMenuId(null)}
                            >
                              <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-error hover:bg-secondary/60"
                              onClick={() => void handleDelete(c._id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
