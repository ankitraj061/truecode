'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { axiosClient } from '@/app/utils/axiosClient';
import Footer from '@/app/components/Footer';

interface OrderStatusHistory {
  status: string;
  note: string;
  updatedAt: string;
}

interface MyOrder {
  _id: string;
  productName: string;
  pointsSpent: number;
  status: 'pending' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  address: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  statusHistory: OrderStatusHistory[];
  createdAt: string;
}

const STATUS_STEPS: { key: string; label: string; icon: string }[] = [
  { key: 'pending',          label: 'Order Placed',     icon: '📋' },
  { key: 'packed',           label: 'Packed',           icon: '📦' },
  { key: 'shipped',          label: 'Shipped',          icon: '🚚' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵' },
  { key: 'delivered',        label: 'Delivered',        icon: '✅' },
];

function getStatusIndex(status: string) {
  if (status === 'cancelled') return -1;
  return STATUS_STEPS.findIndex(s => s.key === status);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatusBadge(status: MyOrder['status']) {
  const map: Record<MyOrder['status'], { label: string; style: React.CSSProperties }> = {
    pending:          { label: 'Pending',          style: { color: 'var(--color-warning)',   backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)' } },
    packed:           { label: 'Packed',           style: { color: 'var(--color-brand)',     backgroundColor: 'color-mix(in srgb, var(--color-brand) 15%, transparent)' } },
    shipped:          { label: 'Shipped',          style: { color: '#a855f7',                backgroundColor: 'rgba(168,85,247,0.15)' } },
    out_for_delivery: { label: 'Out for Delivery', style: { color: '#f97316',                backgroundColor: 'rgba(249,115,22,0.15)' } },
    delivered:        { label: 'Delivered',        style: { color: 'var(--color-success)',   backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)' } },
    cancelled:        { label: 'Cancelled',        style: { color: 'var(--color-error)',     backgroundColor: 'color-mix(in srgb, var(--color-error) 15%, transparent)' } },
  };
  const { label, style } = map[status];
  return (
    <span
      style={style}
      className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
    >
      {label}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-elevated border border-primary rounded-2xl p-6 shadow-sm animate-pulse">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="h-5 bg-secondary rounded w-48" />
        <div className="flex items-center gap-2">
          <div className="h-5 bg-secondary rounded w-20" />
          <div className="h-5 bg-secondary rounded w-16" />
          <div className="h-5 bg-secondary rounded w-16" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-6 mb-2">
        {STATUS_STEPS.map((_, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className="w-8 h-8 rounded-full bg-secondary" />
            <div className="h-3 bg-secondary rounded w-12 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderTimeline({ status }: { status: MyOrder['status'] }) {
  const currentIndex = getStatusIndex(status);

  return (
    <div className="mt-5">
      <div className="flex items-start">
        {STATUS_STEPS.map((step, i) => {
          const filled = i <= currentIndex;
          const isLast = i === STATUS_STEPS.length - 1;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {/* Circle */}
                <div className="flex flex-col items-center">
                  <div
                    style={filled ? { backgroundColor: 'var(--color-brand)' } : { backgroundColor: 'var(--bg-secondary)', border: '1.5px solid var(--border-primary)' }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                  >
                    {filled ? (
                      <span className="text-white text-xs">{step.icon}</span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{step.icon}</span>
                    )}
                  </div>
                </div>

                {/* Connecting line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-1" style={{ backgroundColor: i < currentIndex ? 'var(--color-brand)' : 'var(--bg-secondary)' }} />
                )}
              </div>

              {/* Label */}
              <span
                className="text-center mt-2 leading-tight"
                style={{
                  fontSize: '0.65rem',
                  color: filled ? 'var(--color-brand)' : 'var(--text-tertiary)',
                  fontWeight: filled ? 600 : 400,
                  maxWidth: '4rem',
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: MyOrder }) {
  const [addressOpen, setAddressOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const isCancelled = order.status === 'cancelled';

  const sortedHistory = [...(order.statusHistory || [])].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="bg-elevated border border-primary rounded-2xl p-6 shadow-sm">
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {order.productName}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {formatDate(order.createdAt)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Points badge */}
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              color: 'var(--color-brand)',
              backgroundColor: 'color-mix(in srgb, var(--color-brand) 15%, transparent)',
            }}
          >
            {order.pointsSpent} pts
          </span>

          {getStatusBadge(order.status)}
        </div>
      </div>

      {/* Timeline or Cancelled banner */}
      {isCancelled ? (
        <div
          className="mt-5 rounded-xl px-4 py-3 flex items-center gap-2 font-semibold text-sm"
          style={{
            color: 'var(--color-error)',
            backgroundColor: 'color-mix(in srgb, var(--color-error) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)',
          }}
        >
          <span>✕</span>
          <span>Order Cancelled</span>
        </div>
      ) : (
        <OrderTimeline status={order.status} />
      )}

      {/* Collapsible: Delivery Address */}
      <div className="mt-5 border-t border-primary pt-4">
        <button
          onClick={() => setAddressOpen(v => !v)}
          className="flex items-center justify-between w-full text-sm font-medium cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span>Delivery Address</span>
          <svg
            className="w-4 h-4 transition-transform duration-200"
            style={{ transform: addressOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {addressOpen && (
          <div
            className="mt-3 rounded-xl p-4 text-sm grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            <div>
              <span style={{ color: 'var(--text-tertiary)' }} className="text-xs uppercase tracking-wide">Name</span>
              <p style={{ color: 'var(--text-primary)' }} className="font-medium">{order.address.fullName}</p>
            </div>
            <div>
              <span style={{ color: 'var(--text-tertiary)' }} className="text-xs uppercase tracking-wide">Phone</span>
              <p style={{ color: 'var(--text-primary)' }} className="font-medium">{order.address.phone}</p>
            </div>
            <div className="sm:col-span-2">
              <span style={{ color: 'var(--text-tertiary)' }} className="text-xs uppercase tracking-wide">Street</span>
              <p style={{ color: 'var(--text-primary)' }} className="font-medium">{order.address.street}</p>
            </div>
            <div>
              <span style={{ color: 'var(--text-tertiary)' }} className="text-xs uppercase tracking-wide">City / State</span>
              <p style={{ color: 'var(--text-primary)' }} className="font-medium">{order.address.city}, {order.address.state}</p>
            </div>
            <div>
              <span style={{ color: 'var(--text-tertiary)' }} className="text-xs uppercase tracking-wide">Pincode</span>
              <p style={{ color: 'var(--text-primary)' }} className="font-medium">{order.address.pincode}</p>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible: Status History */}
      {sortedHistory.length > 0 && (
        <div className="mt-3 border-t border-primary pt-4">
          <button
            onClick={() => setHistoryOpen(v => !v)}
            className="flex items-center justify-between w-full text-sm font-medium cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>Status History</span>
            <svg
              className="w-4 h-4 transition-transform duration-200"
              style={{ transform: historyOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {historyOpen && (
            <ul className="mt-3 space-y-2">
              {sortedHistory.map((entry, i) => (
                <li
                  key={i}
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                      {entry.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatDate(entry.updatedAt)}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>{entry.note}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const toOrderArray = (data: unknown): MyOrder[] => {
      if (Array.isArray((data as { redemptions?: unknown })?.redemptions)) {
        return (data as { redemptions: MyOrder[] }).redemptions;
      }
      if (Array.isArray((data as { orders?: unknown })?.orders)) {
        return (data as { orders: MyOrder[] }).orders;
      }
      if (Array.isArray(data)) {
        return data as MyOrder[];
      }
      return [];
    };

    axiosClient
      .get('/api/redeem/my')
      .then((res) => setOrders(toOrderArray(res.data)))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <div className="border-b border-primary bg-elevated">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/redeem"
              className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              aria-label="Back to Redeem"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                My Orders
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Track your redemption orders
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="space-y-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-5 text-4xl"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              🛍️
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              No orders yet
            </h2>
            <p className="mb-6 max-w-xs" style={{ color: 'var(--text-tertiary)' }}>
              You haven&apos;t redeemed any rewards. Start browsing and redeem your points!
            </p>
            <Link
              href="/redeem"
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-brand)', color: '#fff' }}
            >
              Browse Rewards
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map(order => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
