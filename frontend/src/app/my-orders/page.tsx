'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { axiosClient } from '@/app/utils/axiosClient';
import Footer from '@/app/components/Footer';
import {
  Package, Star, MapPin, ChevronDown, ArrowLeft,
  Check, X, Clock, Truck, Box, ShoppingBag, Home,
} from 'lucide-react';

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

const STATUS_STEPS: { key: string; label: string; Icon: React.ElementType }[] = [
  { key: 'pending',          label: 'Placed',       Icon: Clock },
  { key: 'packed',           label: 'Packed',        Icon: Box },
  { key: 'shipped',          label: 'Shipped',       Icon: Truck },
  { key: 'out_for_delivery', label: 'On the way',    Icon: ShoppingBag },
  { key: 'delivered',        label: 'Delivered',     Icon: Home },
];

const STATUS_META: Record<MyOrder['status'], { label: string; color: string; bg: string; border: string }> = {
  pending:          { label: 'Pending',          color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  packed:           { label: 'Packed',           color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
  shipped:          { label: 'Shipped',          color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)' },
  out_for_delivery: { label: 'Out for Delivery', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
  delivered:        { label: 'Delivered',        color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  cancelled:        { label: 'Cancelled',        color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)' },
};

function getStatusIndex(status: string) {
  if (status === 'cancelled') return -1;
  return STATUS_STEPS.findIndex(s => s.key === status);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: MyOrder['status'] }) {
  const m = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

function OrderTimeline({ status }: { status: MyOrder['status'] }) {
  const currentIdx = getStatusIndex(status);

  return (
    <div className="flex items-start mt-1">
      {STATUS_STEPS.map((step, i) => {
        const reached = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const isLast = i === STATUS_STEPS.length - 1;
        const StepIcon = step.Icon;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  reached
                    ? 'bg-[var(--primary)] shadow-md'
                    : 'bg-[var(--muted)] border border-[var(--border)]'
                } ${isCurrent ? 'ring-2 ring-[var(--primary)]/30 ring-offset-2 ring-offset-[var(--card)]' : ''}`}
              >
                {reached ? (
                  i < currentIdx
                    ? <Check className="w-4 h-4 text-white" />
                    : <StepIcon className="w-4 h-4 text-white" />
                ) : (
                  <StepIcon className="w-4 h-4 text-[var(--muted-foreground)]" />
                )}
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full bg-[var(--primary)]/20 animate-ping" />
                )}
              </div>
              <span
                className="text-center leading-tight whitespace-pre-line"
                style={{
                  fontSize: '0.625rem',
                  fontWeight: reached ? 600 : 400,
                  color: reached ? 'var(--primary)' : 'var(--muted-foreground)',
                  maxWidth: '3.5rem',
                }}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className="flex-1 h-[2px] mx-1 mb-5 rounded-full transition-all duration-500"
                style={{ background: i < currentIdx ? 'var(--primary)' : 'var(--border)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Accordion({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-[var(--border)] pt-3 mt-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full py-1 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </span>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OrderCard({ order, index }: { order: MyOrder; index: number }) {
  const isCancelled = order.status === 'cancelled';
  const meta = STATUS_META[order.status];
  const sortedHistory = [...(order.statusHistory || [])].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {/* Accent stripe */}
      <div className="h-1 w-full" style={{ background: isCancelled ? '#ef4444' : `linear-gradient(90deg, ${meta.color}, ${meta.color}88)` }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <p className="font-bold text-[var(--foreground)] text-base">{order.productName}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Ordered {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
            >
              <Star className="w-3 h-3 fill-current" />
              {order.pointsSpent.toLocaleString()} pts
            </span>
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Timeline or cancelled */}
        {isCancelled ? (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <X className="w-4 h-4 flex-shrink-0" />
            Order Cancelled
          </div>
        ) : (
          <OrderTimeline status={order.status} />
        )}

        {/* Delivery Address accordion */}
        <Accordion label="Delivery Address" icon={MapPin}>
          <div
            className="rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
            style={{ background: 'var(--muted)' }}
          >
            {[
              { label: 'Name',       value: order.address.fullName },
              { label: 'Phone',      value: order.address.phone },
              { label: 'Street',     value: order.address.street, span: true },
              { label: 'City/State', value: `${order.address.city}, ${order.address.state}` },
              { label: 'Pincode',    value: order.address.pincode },
            ].map(({ label, value, span }) => (
              <div key={label} className={span ? 'sm:col-span-2' : ''}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-0.5">{label}</p>
                <p className="text-sm font-medium text-[var(--foreground)]">{value}</p>
              </div>
            ))}
          </div>
        </Accordion>

        {/* Status History accordion */}
        {sortedHistory.length > 0 && (
          <Accordion label="Status History" icon={Clock}>
            <div className="space-y-2">
              {sortedHistory.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'var(--muted)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: i === 0 ? meta.color : 'var(--border)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className="font-semibold capitalize"
                        style={{ color: i === 0 ? meta.color : 'var(--foreground)' }}
                      >
                        {entry.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">{formatDateTime(entry.updatedAt)}</span>
                    </div>
                    {entry.note && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{entry.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Accordion>
        )}
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden animate-pulse">
      <div className="h-1 w-full bg-[var(--muted)]" />
      <div className="p-5 space-y-4">
        <div className="flex justify-between gap-3">
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-[var(--muted)]" />
            <div className="h-3 w-24 rounded bg-[var(--muted)]" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-[var(--muted)]" />
            <div className="h-6 w-20 rounded-full bg-[var(--muted)]" />
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="w-9 h-9 rounded-full bg-[var(--muted)] flex-shrink-0" />
              {i < 4 && <div className="flex-1 h-0.5 mx-1 bg-[var(--muted)]" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const toOrderArray = (data: unknown): MyOrder[] => {
      if (Array.isArray((data as { redemptions?: unknown })?.redemptions))
        return (data as { redemptions: MyOrder[] }).redemptions;
      if (Array.isArray((data as { orders?: unknown })?.orders))
        return (data as { orders: MyOrder[] }).orders;
      if (Array.isArray(data)) return data as MyOrder[];
      return [];
    };

    axiosClient
      .get('/api/redeem/my')
      .then(res => setOrders(toOrderArray(res.data)))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--card)]">
        <motion.div
          className="max-w-3xl mx-auto px-4 sm:px-6 py-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex items-center gap-4">
            <Link
              href="/redeem"
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/20 transition-all"
              aria-label="Back to Redeem"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10">
                <Package className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--foreground)]">My Orders</h1>
                <p className="text-sm text-[var(--muted-foreground)]">Track your redemption orders</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-28 text-center"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-24 h-24 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mb-6">
              <Package className="w-12 h-12 text-[var(--primary)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">No orders yet</h2>
            <p className="text-[var(--muted-foreground)] max-w-xs mb-7 text-sm">
              You haven&apos;t redeemed any rewards. Earn points, then browse the store!
            </p>
            <Link
              href="/redeem"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Star className="w-4 h-4" />
              Browse Rewards
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <OrderCard key={order._id} order={order} index={i} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
