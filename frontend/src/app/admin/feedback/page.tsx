'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquare, ChevronLeft, ChevronRight, RefreshCw, Mail, CheckCircle2, RotateCcw } from 'lucide-react';
import { AdminAPI, type AdminFeedbackItem, type FeedbackStatus, type FeedbackType } from '../utils/adminAPI';

type TypeTab = 'all' | FeedbackType;
type StatusTab = 'all' | FeedbackStatus;

const TYPE_TABS: { value: TypeTab; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'bug', label: 'Bug Report', icon: '🐛' },
  { value: 'suggestion', label: 'Feature Request', icon: '💡' },
  { value: 'question', label: 'Question', icon: '❓' },
  { value: 'other', label: 'General', icon: '💬' },
];

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function typeMeta(type: FeedbackType) {
  return TYPE_TABS.find((t) => t.value === type) ?? { label: type, icon: '💬' };
}

function getUserDisplayName(user: AdminFeedbackItem['userId']): string {
  const full = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  return full || user?.username || 'Unknown user';
}

function buildMailto(item: AdminFeedbackItem): string {
  const name = getUserDisplayName(item.userId);
  const subject = encodeURIComponent('Re: Your feedback on TrueCode');
  const body = encodeURIComponent(
    `Hi ${name},\n\nThanks for reaching out about:\n"${item.message}"\n\n`
  );
  return `mailto:${item.userId?.emailId ?? ''}?subject=${subject}&body=${body}`;
}

function FeedbackCard({
  item,
  onStatusUpdated,
}: {
  item: AdminFeedbackItem;
  onStatusUpdated: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const meta = typeMeta(item.type);
  const hasEmail = Boolean(item.userId?.emailId);

  const handleToggleStatus = async () => {
    setUpdateError(null);
    setUpdating(true);
    try {
      await AdminAPI.updateFeedbackStatus(item._id, item.status === 'open' ? 'resolved' : 'open');
      onStatusUpdated();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to update status';
      setUpdateError(msg);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="card bg-elevated border border-border-primary space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl" aria-hidden>
              {meta.icon}
            </span>
            <p className="font-semibold text-primary">{getUserDisplayName(item.userId)}</p>
            {item.userId?.username && (
              <span className="text-xs text-secondary">@{item.userId.username}</span>
            )}
          </div>
          <p className="text-xs text-secondary mt-0.5">
            {hasEmail ? item.userId.emailId : 'No email on file'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary/40 text-secondary border border-border-primary">
            {meta.label}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              item.status === 'resolved'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}
          >
            {item.status === 'resolved' ? 'Resolved' : 'Open'}
          </span>
        </div>
      </div>

      <p className="text-sm text-primary whitespace-pre-wrap">{item.message}</p>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-secondary">
        <span>Submitted {formatDate(item.createdAt)}</span>
        {item.problemSlug && <span>Related to problem: {item.problemSlug}</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <a
          href={hasEmail ? buildMailto(item) : undefined}
          aria-disabled={!hasEmail}
          className={`btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs ${
            !hasEmail ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          <Mail className="h-3.5 w-3.5" aria-hidden />
          Reply via email
        </a>
        <button
          type="button"
          onClick={() => void handleToggleStatus()}
          disabled={updating}
          className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-50"
        >
          {updating ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : item.status === 'open' ? (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          )}
          {item.status === 'open' ? 'Mark resolved' : 'Reopen'}
        </button>
        {updateError && <p className="text-xs text-error">{updateError}</p>}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card bg-elevated border border-border-primary animate-pulse space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-40 rounded bg-secondary/40" />
          <div className="h-3 w-56 rounded bg-secondary/30" />
        </div>
        <div className="h-6 w-20 rounded-full bg-secondary/30" />
      </div>
      <div className="h-3 w-full rounded bg-secondary/20" />
      <div className="h-3 w-2/3 rounded bg-secondary/20" />
    </div>
  );
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<AdminFeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeTab, setTypeTab] = useState<TypeTab>('all');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PAGE_LIMIT = 20;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_LIMIT) : 1;

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AdminAPI.getAdminFeedback({
        page,
        limit: PAGE_LIMIT,
        type: typeTab === 'all' ? undefined : typeTab,
        status: statusTab === 'all' ? undefined : statusTab,
      });
      setItems(response.feedback ?? []);
      setTotal(response.total ?? 0);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to load feedback';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, typeTab, statusTab]);

  useEffect(() => {
    void fetchFeedback();
  }, [fetchFeedback]);

  const handleTypeChange = (tab: TypeTab) => {
    setTypeTab(tab);
    setPage(1);
  };

  const handleStatusChange = (tab: StatusTab) => {
    setStatusTab(tab);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <MessageSquare className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-primary">User feedback</h2>
          <p className="text-sm text-secondary">
            Review feedback submitted by users and reply via email when one is on file.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleTypeChange(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeTab === tab.value
                  ? 'bg-brand text-white'
                  : 'bg-secondary/40 text-secondary hover:text-primary hover:bg-secondary/70'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleStatusChange(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusTab === tab.value
                  ? 'bg-brand text-white'
                  : 'bg-secondary/40 text-secondary hover:text-primary hover:bg-secondary/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {!loading && !error && (
        <p className="text-xs text-secondary">
          Showing {items.length} of {total} item{total !== 1 ? 's' : ''}
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 px-4 py-3 text-sm text-error flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void fetchFeedback()}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs text-error border border-error/50 rounded px-2 py-1 hover:bg-error/10 transition-colors"
          >
            <RefreshCw className="h-3 w-3" aria-hidden />
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="card bg-elevated border border-border-primary py-16 flex flex-col items-center justify-center gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-secondary/30 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-secondary" aria-hidden />
          </div>
          <div>
            <p className="font-medium text-primary">No feedback found</p>
            <p className="text-sm text-secondary mt-1">
              No feedback matches the selected filters yet.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-4">
          {items.map((item) => (
            <FeedbackCard key={item._id} item={item} onStatusUpdated={() => void fetchFeedback()} />
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-secondary pt-2">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
