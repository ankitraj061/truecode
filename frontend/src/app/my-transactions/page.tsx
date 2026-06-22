'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { axiosClient } from '@/app/utils/axiosClient';
import Footer from '@/app/components/Footer';
import { RootState, AppDispatch } from '@/app/store/store';
import { checkAuth } from '@/app/slices/authSlice';
import { loadRazorpayScript, openRazorpayCheckout, type RazorpayResponse } from '@/app/premium/razorpay';
import {
  Receipt, ArrowLeft, CreditCard, Check, X, Clock, RotateCcw, AlertTriangle, Ban,
} from 'lucide-react';

type TransactionStatus = 'created' | 'paid' | 'failed' | 'expired' | 'cancelled';

interface Transaction {
  _id: string;
  plan: 'monthly' | 'yearly';
  amount: number; // paise
  currency: string;
  status: TransactionStatus;
  createdAt: string;
  resumable: boolean;
}

const RESERVATION_MINUTES = 10;

const STATUS_META: Record<TransactionStatus, { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
  created:   { label: 'Pending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', Icon: Clock },
  paid:      { label: 'Paid',      color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', Icon: Check },
  failed:    { label: 'Failed',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)', Icon: X },
  expired:   { label: 'Expired',   color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', Icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', Icon: Ban },
};

function formatAmount(paise: number, currency: string) {
  const value = paise / 100;
  return `${currency === 'INR' ? '₹' : currency + ' '}${value.toLocaleString('en-IN')}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function minutesLeft(createdAt: string) {
  const elapsedMs = Date.now() - new Date(createdAt).getTime();
  const remainingMs = RESERVATION_MINUTES * 60 * 1000 - elapsedMs;
  return Math.max(0, Math.ceil(remainingMs / 60000));
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      <m.Icon className="w-3 h-3" />
      {m.label}
    </span>
  );
}

function CancelConfirmModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-xl max-w-sm w-full p-6 animate-slide-up">
        <div className="w-11 h-11 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center mb-4">
          <Ban className="w-5 h-5 text-[var(--destructive)]" />
        </div>
        <h3 className="text-base font-bold text-[var(--foreground)] mb-1.5">Cancel this payment?</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-5">
          This pending payment will be marked as cancelled and can no longer be resumed.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 text-sm font-medium px-4 py-2.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-lg bg-[var(--destructive)] text-white hover:opacity-90 transition-opacity"
          >
            Yes, cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function TransactionCard({
  transaction,
  index,
  onChanged,
}: {
  transaction: Transaction;
  index: number;
  onChanged: () => void;
}) {
  const [resuming, setResuming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch<AppDispatch>();

  const remaining = transaction.status === 'created' ? minutesLeft(transaction.createdAt) : 0;
  const canResume = transaction.resumable && remaining > 0;
  const canCancel = transaction.status === 'created';

  const handleCancel = async () => {
    setConfirmingCancel(false);
    if (cancelling || resuming) return;
    setCancelling(true);
    setError(null);
    try {
      await axiosClient.post(`/api/payments/${transaction._id}/cancel`, {});
      onChanged();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || 'Unable to cancel this payment.';
      setError(message);
      setCancelling(false);
    }
  };

  const handleResume = async () => {
    if (resuming) return;
    setResuming(true);
    setError(null);
    try {
      const resp = await axiosClient.post(`/api/payments/${transaction._id}/resume`, {});
      const { order, key } = resp.data;

      const opened = openRazorpayCheckout({
        order,
        key: key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        plan: transaction.plan,
        prefill: {
          name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
          email: user?.emailId,
        },
        onSuccess: async (response: RazorpayResponse) => {
          try {
            await axiosClient.post('/api/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: transaction.plan,
            });
            await dispatch(checkAuth());
          } finally {
            setResuming(false);
            onChanged();
          }
        },
        onFailure: () => setResuming(false),
        onDismiss: () => setResuming(false),
      });

      if (!opened) {
        setError('Payment service is still loading. Please try again in a moment.');
        setResuming(false);
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || 'This payment window has expired. Please start a new payment.';
      setError(message);
      setResuming(false);
      onChanged();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <div className="h-1 w-full" style={{ background: STATUS_META[transaction.status].color }} />
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-bold text-[var(--foreground)] text-base capitalize">
              {transaction.plan} Subscription
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {formatDateTime(transaction.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {formatAmount(transaction.amount, transaction.currency)}
            </span>
            <StatusBadge status={transaction.status} />
          </div>
        </div>

        {canCancel && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-[var(--muted-foreground)]">
              {canResume ? (
                <>Resumable for <span className="font-semibold text-[var(--foreground)]">{remaining} more min{remaining === 1 ? '' : 's'}</span></>
              ) : (
                'This payment is still pending.'
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmingCancel(true)}
                disabled={cancelling || resuming}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:border-[var(--destructive)]/40 disabled:opacity-50 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                {cancelling ? 'Cancelling…' : 'Cancel'}
              </button>
              {canResume && (
                <button
                  onClick={handleResume}
                  disabled={resuming || cancelling}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {resuming ? 'Opening checkout…' : 'Resume Payment'}
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 text-xs text-[var(--destructive)]">{error}</p>
        )}
      </div>

      {confirmingCancel && (
        <CancelConfirmModal onConfirm={handleCancel} onClose={() => setConfirmingCancel(false)} />
      )}
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden animate-pulse">
      <div className="h-1 w-full bg-[var(--muted)]" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between gap-3">
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-[var(--muted)]" />
            <div className="h-3 w-24 rounded bg-[var(--muted)]" />
          </div>
          <div className="h-6 w-16 rounded-full bg-[var(--muted)]" />
        </div>
      </div>
    </div>
  );
}

export default function MyTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(() => {
    axiosClient
      .get('/api/payments/my-transactions')
      .then((res) => setTransactions(res.data?.transactions || []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRazorpayScript();
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="border-b border-[var(--border)] bg-[var(--card)]">
        <motion.div
          className="max-w-3xl mx-auto px-4 sm:px-6 py-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex items-center gap-4">
            <Link
              href="/premium"
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/20 transition-all"
              aria-label="Back to Premium"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10">
                <Receipt className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--foreground)]">My Transactions</h1>
                <p className="text-sm text-[var(--muted-foreground)]">Your subscription payment history</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : transactions.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-28 text-center"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-24 h-24 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mb-6">
              <CreditCard className="w-12 h-12 text-[var(--primary)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">No transactions yet</h2>
            <p className="text-[var(--muted-foreground)] max-w-xs mb-7 text-sm">
              You haven&apos;t made any subscription payments. Upgrade to Premium to get started.
            </p>
            <Link
              href="/premium"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <CreditCard className="w-4 h-4" />
              View Premium Plans
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {transactions.map((t, i) => (
              <TransactionCard key={t._id} transaction={t} index={i} onChanged={fetchTransactions} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
