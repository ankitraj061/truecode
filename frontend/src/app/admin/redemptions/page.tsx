'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { axiosClient } from '@/app/utils/axiosClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type RedemptionStatus =
  | 'pending'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

interface StatusHistoryEntry {
  status: RedemptionStatus;
  note?: string;
  updatedAt: string;
  updatedBy?: string;
}

interface DeliveryAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface RedemptionUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  username: string;
  emailId: string;
}

interface Redemption {
  _id: string;
  userId: RedemptionUser;
  productName: string;
  pointsSpent: number;
  status: RedemptionStatus;
  deliveryAddress?: DeliveryAddress;
  address?: DeliveryAddress;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

interface RedemptionsResponse {
  redemptions: Redemption[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: RedemptionStatus[] = [
  'pending',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

type FilterTab = 'all' | RedemptionStatus;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusBadgeClass(status: RedemptionStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
    case 'packed':
      return 'bg-brand/10 text-brand border border-brand/30';
    case 'shipped':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
    case 'out_for_delivery':
      return 'bg-orange-500/10 text-orange-400 border border-orange-500/30';
    case 'delivered':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
    case 'cancelled':
      return 'bg-error/10 text-error border border-error/30';
    default:
      return 'bg-secondary text-secondary border border-border-primary';
  }
}

function statusDotClass(status: RedemptionStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-400';
    case 'packed':
      return 'bg-brand';
    case 'shipped':
      return 'bg-purple-400';
    case 'out_for_delivery':
      return 'bg-orange-400';
    case 'delivered':
      return 'bg-emerald-400';
    case 'cancelled':
      return 'bg-error';
    default:
      return 'bg-secondary';
  }
}

function getUserDisplayName(user: RedemptionUser): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return full || user.username;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="card bg-elevated border border-border-primary animate-pulse space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-40 rounded bg-secondary/40" />
          <div className="h-3 w-56 rounded bg-secondary/30" />
        </div>
        <div className="h-6 w-20 rounded-full bg-secondary/30" />
      </div>
      <div className="h-3 w-32 rounded bg-secondary/30" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-3 w-full rounded bg-secondary/20" />
        <div className="h-3 w-full rounded bg-secondary/20" />
      </div>
    </div>
  );
}

interface StatusTimelineProps {
  history: StatusHistoryEntry[];
}

function StatusTimeline({ history }: StatusTimelineProps) {
  if (history.length === 0) {
    return <p className="text-xs text-secondary italic">No status history available.</p>;
  }

  return (
    <ol className="relative border-l border-border-primary ml-2 space-y-3">
      {[...history].reverse().map((entry, idx) => (
        <li key={idx} className="ml-4">
          <span
            className={`absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-elevated ${statusDotClass(entry.status)}`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusBadgeClass(entry.status)}`}
            >
              {formatStatus(entry.status)}
            </span>
            <span className="text-[11px] text-secondary">{formatDate(entry.updatedAt)}</span>
            {entry.updatedBy && (
              <span className="text-[11px] text-secondary">by {entry.updatedBy}</span>
            )}
          </div>
          {entry.note && (
            <p className="mt-0.5 text-xs text-secondary">{entry.note}</p>
          )}
        </li>
      ))}
    </ol>
  );
}

interface RedemptionCardProps {
  redemption: Redemption;
  onStatusUpdated: () => void;
}

function RedemptionCard({ redemption, onStatusUpdated }: RedemptionCardProps) {
  const [selectedStatus, setSelectedStatus] = useState<RedemptionStatus>(redemption.status);
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleUpdate = async () => {
    setUpdateError(null);
    setUpdateSuccess(false);
    setUpdating(true);
    try {
      await axiosClient.patch(`/api/admin/redemptions/${redemption._id}/status`, {
        status: selectedStatus,
        note: note.trim() || undefined,
      });
      setUpdateSuccess(true);
      setNote('');
      onStatusUpdated();
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to update status';
      setUpdateError(msg);
    } finally {
      setUpdating(false);
    }
  };

  const addr = redemption.deliveryAddress ?? redemption.address;
  const user = redemption.userId;

  return (
    <div className="card bg-elevated border border-border-primary space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-primary">{getUserDisplayName(user)}</p>
            <span className="text-xs text-secondary">@{user.username}</span>
          </div>
          <p className="text-xs text-secondary mt-0.5">{user.emailId}</p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${statusBadgeClass(redemption.status)}`}
        >
          {formatStatus(redemption.status)}
        </span>
      </div>

      {/* Product + points + date */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div>
          <span className="text-secondary text-xs">Product</span>
          <p className="font-medium text-primary">{redemption.productName}</p>
        </div>
        <div>
          <span className="text-secondary text-xs">Points spent</span>
          <p className="font-medium text-brand">{redemption.pointsSpent.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-secondary text-xs">Order date</span>
          <p className="font-medium text-primary">{formatDate(redemption.createdAt)}</p>
        </div>
      </div>

      {/* Delivery address */}
      <div className="rounded-lg bg-secondary/30 border border-border-primary px-3 py-2.5 text-xs space-y-0.5">
        <p className="text-secondary font-medium mb-1 text-[11px] uppercase tracking-wide">
          Delivery address
        </p>
        {addr ? (
          <>
            <p className="text-primary font-medium">{addr.fullName}</p>
            <p className="text-secondary">{addr.phone}</p>
            <p className="text-secondary">{addr.street}</p>
            <p className="text-secondary">
              {addr.city}, {addr.state} — {addr.pincode}
            </p>
          </>
        ) : (
          <p className="text-secondary italic">Address unavailable</p>
        )}
      </div>

      {/* Status update */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-secondary uppercase tracking-wide">Update status</p>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as RedemptionStatus)}
            className="input text-sm py-1.5 pr-8 min-w-[160px]"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {formatStatus(s)}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note..."
            className="input text-sm py-1.5 flex-1 min-w-[160px]"
          />
          <button
            type="button"
            onClick={() => void handleUpdate()}
            disabled={updating || selectedStatus === redemption.status}
            className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm shrink-0 disabled:opacity-50"
          >
            {updating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Updating...
              </>
            ) : (
              'Update'
            )}
          </button>
        </div>
        {updateError && (
          <p className="text-xs text-error">{updateError}</p>
        )}
        {updateSuccess && (
          <p className="text-xs text-success">Status updated successfully.</p>
        )}
      </div>

      {/* Status history toggle */}
      <div>
        <button
          type="button"
          onClick={() => setHistoryOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-primary transition-colors"
        >
          {historyOpen ? (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          )}
          {historyOpen ? 'Hide' : 'Show'} status history
          {redemption.statusHistory.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-secondary/40 text-[10px]">
              {redemption.statusHistory.length}
            </span>
          )}
        </button>

        {historyOpen && (
          <div className="mt-3">
            <StatusTimeline history={redemption.statusHistory} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminRedemptionsPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PAGE_LIMIT = 20;

  const fetchRedemptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: PAGE_LIMIT };
      if (activeTab !== 'all') params.status = activeTab;

      const res = await axiosClient.get<RedemptionsResponse>('/api/admin/redemptions', { params });
      const data = res.data;
      setRedemptions(data.redemptions ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to load redemptions';
      setError(msg);
      setRedemptions([]);
    } finally {
      setLoading(false);
    }
  }, [page, activeTab]);

  useEffect(() => {
    void fetchRedemptions();
  }, [fetchRedemptions]);

  // Reset to page 1 when tab changes
  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <ShoppingCart className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-primary">Redemption orders</h2>
          <p className="text-sm text-secondary">
            View and manage user redemption requests. Update statuses and track delivery.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTabChange(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-brand text-white'
                : 'bg-secondary/40 text-secondary hover:text-primary hover:bg-secondary/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results summary */}
      {!loading && !error && (
        <p className="text-xs text-secondary">
          Showing {redemptions.length} of {total} order{total !== 1 ? 's' : ''}
          {activeTab !== 'all' ? ` · filtered by "${formatStatus(activeTab)}"` : ''}
        </p>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-error/50 bg-error/10 px-4 py-3 text-sm text-error flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void fetchRedemptions()}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs text-error border border-error/50 rounded px-2 py-1 hover:bg-error/10 transition-colors"
          >
            <RefreshCw className="h-3 w-3" aria-hidden />
            Retry
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && redemptions.length === 0 && (
        <div className="card bg-elevated border border-border-primary py-16 flex flex-col items-center justify-center gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-secondary/30 flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-secondary" aria-hidden />
          </div>
          <div>
            <p className="font-medium text-primary">No redemption orders found</p>
            <p className="text-sm text-secondary mt-1">
              {activeTab === 'all'
                ? 'No users have redeemed points yet.'
                : `No orders with status "${formatStatus(activeTab)}".`}
            </p>
          </div>
          {activeTab !== 'all' && (
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className="text-xs text-brand hover:underline"
            >
              View all orders
            </button>
          )}
        </div>
      )}

      {/* Redemption cards */}
      {!loading && !error && redemptions.length > 0 && (
        <div className="space-y-4">
          {redemptions.map((r) => (
            <RedemptionCard
              key={r._id}
              redemption={r}
              onStatusUpdated={() => void fetchRedemptions()}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
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
