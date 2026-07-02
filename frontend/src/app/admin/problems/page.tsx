'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ListChecks,
  FilePlus,
  Search,
  MoreVertical,
  Pencil,
  Power,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminAPI, type AdminProblem } from '../utils/adminAPI';
import ProblemForm from '../ProblemForm';
import Loader from '@/app/components/TruckLoader';

export default function AdminProblemsPage() {
  const [problems, setProblems] = useState<AdminProblem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [editingProblem, setEditingProblem] = useState<AdminProblem | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const pageSize = 20;
  const totalPages = useMemo(() => (total > 0 ? Math.ceil(total / pageSize) : 1), [total]);

  const loadProblems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AdminAPI.getAdminProblems({
        page,
        limit: pageSize,
        search: search || undefined,
        difficulty: difficulty || undefined,
        isActive: status === 'all' ? undefined : status === 'active',
      });

      setProblems(response.problems);
      setTotal(response.total);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error).message ??
        'Failed to load problems';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, search, difficulty, status]);

  useEffect(() => {
    void loadProblems();
  }, [loadProblems]);

  const closeForm = () => {
    setEditingProblem(null);
  };

  const handleStartEdit = (problem: AdminProblem) => {
    setEditingProblem(problem);
    setOpenMenuId(null);
  };

  const handleToggleActive = async (id: string) => {
    try {
      await AdminAPI.toggleProblemActive(id);
      setProblems((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isActive: !p.isActive } : p)),
      );
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error).message ??
        'Failed to toggle problem status';
      setError(message);
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this problem?');
    if (!confirmed) return;

    try {
      await AdminAPI.deleteProblem(id);
      await loadProblems();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error).message ??
        'Failed to delete problem';
      setError(message);
    }
    setOpenMenuId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <ListChecks className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-primary">Problems</h2>
            <p className="text-sm text-secondary">
              Manage coding problems, visibility and metadata.
            </p>
          </div>
        </div>
        <Link
          href="/admin/create-problem"
          className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
        >
          <FilePlus className="h-4 w-4" aria-hidden />
          Create problem
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-elevated border border-border-primary rounded-lg p-4">
        <div className="relative flex-1 min-w-0 md:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary pointer-events-none" aria-hidden />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search by title or slug"
            className="input w-full pl-9"
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => {
            setPage(1);
            setDifficulty(e.target.value);
          }}
          className="input w-full md:w-40"
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as 'all' | 'active' | 'inactive');
          }}
          className="input w-full md:w-40"
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      {editingProblem && (
        <div className="rounded-2xl border border-border-primary bg-elevated/50 p-6">
          <ProblemForm
            editProblem={editingProblem}
            onSuccess={() => {
              void loadProblems();
              closeForm();
            }}
            onCancel={closeForm}
          />
        </div>
      )}

      <div className="card bg-elevated border border-border-primary">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-primary">Problems list</h3>
          <p className="text-xs text-secondary">
            Showing {problems.length} of {total}
          </p>
        </div>

        {error && <p className="text-sm text-error mb-3">{error}</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border-primary text-left">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Slug</th>
                <th className="py-2 pr-4">Difficulty</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Premium</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8">
                    <div className="flex flex-col items-center justify-center py-6">
                      <Loader message="Loading problems" submessage="Fetching problem list..." />
                    </div>
                  </td>
                </tr>
              ) : problems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-secondary">
                    No problems found.
                  </td>
                </tr>
              ) : (
                problems.map((p) => (
                  <tr key={p._id} className="border-t border-border-primary">
                    <td className="py-2 pr-4 max-w-xs">
                      <p className="font-medium text-primary truncate" title={p.title}>
                        {p.title}
                      </p>
                    </td>
                    <td className="py-2 pr-4 text-secondary truncate max-w-xs">
                      {p.slug}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.difficulty === 'easy'
                            ? 'bg-difficulty-easy/10 text-difficulty-easy'
                            : p.difficulty === 'medium'
                            ? 'bg-difficulty-medium/10 text-difficulty-medium'
                            : 'bg-difficulty-hard/10 text-difficulty-hard'
                        }`}
                      >
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.isActive
                            ? 'bg-success/10 text-success'
                            : 'bg-slate-500/10 text-slate-400'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      {p.isPremium ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                          Premium
                        </span>
                      ) : (
                        <span className="text-xs text-secondary">Free</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-secondary">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId((current) => (current === p._id ? null : p._id))
                          }
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border-primary bg-transparent text-secondary hover:bg-secondary/40 hover:text-primary"
                        >
                          <span className="sr-only">Open actions</span>
                          <MoreVertical className="h-4 w-4" aria-hidden />
                        </button>
                        {openMenuId === p._id && (
                          <div className="absolute right-0 z-10 mt-1 w-40 origin-top-right rounded-md border border-border-primary bg-elevated py-1 text-left shadow-lg">
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-brand hover:bg-secondary/60"
                              onClick={() => handleStartEdit(p)}
                            >
                              <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-warning hover:bg-secondary/60"
                              onClick={() => void handleToggleActive(p._id)}
                            >
                              <Power className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              {p.isActive ? 'Make inactive' : 'Make active'}
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-error hover:bg-secondary/60"
                              onClick={() => void handleDelete(p._id)}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs text-secondary">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                Previous
              </button>
              <button
                type="button"
                className="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

