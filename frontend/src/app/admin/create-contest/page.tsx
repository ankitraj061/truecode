'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus } from 'lucide-react';
import { AdminAPI, type ContestAvailableProblem } from '../utils/adminAPI';
import Loader from '@/app/components/TruckLoader';

export default function CreateContestPage() {
  const router = useRouter();
  const [availableProblems, setAvailableProblems] = useState<ContestAvailableProblem[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState<'public' | 'private' | 'educational'>('public');
  const [maxParticipants, setMaxParticipants] = useState<string>('');
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);

  useEffect(() => {
    AdminAPI.getAvailableProblemsForContest()
      .then((res) => setAvailableProblems(res.problems || []))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load problems'))
      .finally(() => setLoadingProblems(false));
  }, []);

  const toggleProblem = (id: string) => {
    setSelectedProblemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !description.trim() || !startTime || !endTime) {
      setError('Please fill title, description, start time and end time.');
      return;
    }
    if (selectedProblemIds.length === 0) {
      setError('Select at least one problem (inactive problems only).');
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
      await AdminAPI.createContest({
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
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create contest';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <CalendarPlus className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-primary">Create contest</h2>
          <p className="text-sm text-secondary">
            Only <strong>inactive</strong> problems (not yet active on the platform) can be added to a contest.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border-primary bg-primary/50 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-primary">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border-primary bg-primary px-3 py-2 text-primary"
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
              className="w-full rounded-lg border border-border-primary bg-primary px-3 py-2 text-primary"
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
              className="w-full rounded-lg border border-border-primary bg-primary px-3 py-2 text-primary"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">End time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-border-primary bg-primary px-3 py-2 text-primary"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'public' | 'private' | 'educational')}
              className="w-full rounded-lg border border-border-primary bg-primary px-3 py-2 text-primary"
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
              className="w-full rounded-lg border border-border-primary bg-primary px-3 py-2 text-primary"
              placeholder="Leave empty for unlimited"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-primary">Problems (inactive only)</label>
          {loadingProblems ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader message="Loading problems" submessage="Fetching inactive problems for contest..." />
            </div>
          ) : availableProblems.length === 0 ? (
            <p className="text-sm text-secondary">
              No inactive problems. Mark some problems as inactive from the Problems page to use them here.
            </p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border-primary bg-secondary/30 p-3">
              {availableProblems.map((p) => (
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
                  <span className={`rounded px-1.5 py-0.5 text-xs capitalize ${p.difficulty === 'easy' ? 'bg-success/20 text-success' : p.difficulty === 'medium' ? 'bg-warning/20 text-warning' : 'bg-error/20 text-error'}`}>
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
            {submitting ? 'Creating…' : 'Create contest'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/contests')}
            className="rounded-lg border border-border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
