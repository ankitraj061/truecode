'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminAPI, type ContestAvailableProblem } from '@/app/admin/utils/adminAPI';
import Loader from '@/app/components/TruckLoader';

type ContestProblem = { _id: string; title: string; slug: string; difficulty: string };

export default function AdminEditContestPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params?.contestId as string;

  const [contest, setContest] = useState<{
    _id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    type: string;
    maxParticipants?: number;
    problems: ContestProblem[];
  } | null>(null);
  const [availableProblems, setAvailableProblems] = useState<ContestAvailableProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState<'public' | 'private' | 'educational'>('public');
  const [maxParticipants, setMaxParticipants] = useState<string>('');
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  // The order the contest was saved with, so unchecking then rechecking a
  // problem restores its original slot instead of silently moving it to the
  // end of an already-scheduled contest's problem order.
  const initialOrderRef = useRef<string[]>([]);

  useEffect(() => {
    if (!contestId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      AdminAPI.getContestById(contestId),
      AdminAPI.getAvailableProblemsForContest(),
    ])
      .then(([contestRes, availRes]) => {
        const c = contestRes.contest as {
          _id: string;
          title: string;
          description: string;
          startTime: string;
          endTime: string;
          type: string;
          maxParticipants?: number;
          problems: ContestProblem[];
        };
        setContest(c);
        setTitle(c.title ?? '');
        setDescription(c.description ?? '');
        setStartTime(c.startTime ? new Date(c.startTime).toISOString().slice(0, 16) : '');
        setEndTime(c.endTime ? new Date(c.endTime).toISOString().slice(0, 16) : '');
        setType((c.type as 'public' | 'private' | 'educational') ?? 'public');
        setMaxParticipants(c.maxParticipants != null ? String(c.maxParticipants) : '');
        const originalOrder = (c.problems ?? []).map((p) => p._id);
        setSelectedProblemIds(originalOrder);
        initialOrderRef.current = originalOrder;
        setAvailableProblems(availRes.problems ?? []);
      })
      .catch((err) => setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, [contestId]);

  const toggleProblem = (id: string) => {
    setSelectedProblemIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      const next = [...prev, id];
      const originalIndex = initialOrderRef.current.indexOf(id);
      if (originalIndex === -1) {
        // Never part of this contest before — append at the end as usual.
        return next;
      }
      // Was part of the saved order — restore its original slot instead of
      // leaving it appended at the end.
      return next.sort((a, b) => {
        const ia = initialOrderRef.current.indexOf(a);
        const ib = initialOrderRef.current.indexOf(b);
        return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
      });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestId) return;
    setError(null);
    if (!title.trim() || !description.trim() || !startTime || !endTime) {
      setError('Please fill title, description, start time and end time.');
      return;
    }
    if (selectedProblemIds.length === 0) {
      setError('Select at least one problem.');
      return;
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      setError('End time must be after start time.');
      return;
    }
    setSubmitting(true);
    try {
      await AdminAPI.updateContest(contestId, {
        title: title.trim(),
        description: description.trim(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        problemIds: selectedProblemIds,
        type,
        maxParticipants: maxParticipants.trim() ? parseInt(maxParticipants, 10) : undefined,
      });
      router.push('/admin/contests');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to update contest';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!contestId) {
    return (
      <div className="space-y-6">
        <p className="text-secondary">Invalid contest.</p>
        <Link href="/admin/contests" className="text-brand hover:underline">← Back to contests</Link>
      </div>
    );
  }

  if (loading && !contest) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader message="Loading contest" submessage="Fetching contest details..." />
      </div>
    );
  }

  const problemsInContest = contest?.problems ?? [];
  const availableNotInContest = availableProblems.filter(
    (ap) => !problemsInContest.some((p) => p._id === ap._id)
  );
  const allProblemsForList = [...problemsInContest, ...availableNotInContest];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-primary">Edit contest</h2>
        <p className="text-sm text-secondary">
          Update contest details. Existing problems may stay even if now active; new additions must be inactive.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border-primary bg-elevated/50 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-primary">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full"
              placeholder="Contest title"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-primary">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input w-full"
              placeholder="Contest description"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">Start time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">End time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'public' | 'private' | 'educational')}
              className="input w-full"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="educational">Educational</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">Max participants (optional)</label>
            <input
              type="number"
              min={0}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              className="input w-full"
              placeholder="Leave empty for unlimited"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-primary">Problems</label>
          {allProblemsForList.length === 0 ? (
            <p className="text-sm text-secondary">No problems in contest and no inactive problems available.</p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border-primary bg-secondary/30 p-3">
              {allProblemsForList.map((p) => (
                <label
                  key={p._id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-secondary/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedProblemIds.includes(p._id)}
                    onChange={() => toggleProblem(p._id)}
                    className="h-4 w-4 rounded border-border-primary text-brand"
                  />
                  <span className="text-sm font-medium text-primary">{p.title}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs capitalize ${
                      p.difficulty === 'easy' ? 'bg-success/20 text-success' : p.difficulty === 'medium' ? 'bg-warning/20 text-warning' : 'bg-error/20 text-error'
                    }`}
                  >
                    {p.difficulty}
                  </span>
                </label>
              ))}
            </div>
          )}
          {selectedProblemIds.length > 0 && (
            <p className="mt-2 text-xs text-secondary">
              Selected: {selectedProblemIds.length} problem(s). Order: Q1, Q2, … (by selection order).
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || selectedProblemIds.length === 0}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-inverse hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
          <Link
            href="/admin/contests"
            className="rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-secondary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
