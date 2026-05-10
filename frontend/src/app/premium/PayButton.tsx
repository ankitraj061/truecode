'use client';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { axiosClient } from '../utils/axiosClient';
import { RootState } from '@/app/store/store';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/app/store/store';
import { checkAuth } from '@/app/slices/authSlice';

// Define Razorpay interfaces
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void> | void;
  prefill: {
    name?: string;
    email?: string;
  };
  notes: {
    plan: string;
  };
  theme: {
    color: string;
  };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayInstance {
  open(): void;
  on?(event: string, handler: () => void): void;
}


export default function PayButton({ plan = 'monthly' }: { plan?: 'monthly' | 'yearly' }) {
  const [loading, setLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const { user } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // add razorpay script if not present
    if (!document.querySelector('#razorpay-script')) {
      const s = document.createElement('script');
      s.id = 'razorpay-script';
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  const handlePay = async () => {
    if (loading) return;
    setLoading(true);
    setPaymentMessage(null);
    try {
      const resp = await axiosClient.post('/api/payments/create-order', { plan });
      const { order, key } = resp.data;

      if (typeof window === 'undefined' || typeof window.Razorpay !== 'function') {
        setPaymentMessage('Payment service is still loading. Please try again in a moment.');
        setLoading(false);
        return;
      }

      const options: RazorpayOptions = {
        key: key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: order.amount,
        currency: order.currency,
        name: 'TrueCode',
        description: `Subscription: ${plan}`,
        order_id: order.id,
        handler: async function (response: RazorpayResponse) {
          try {
            await axiosClient.post('/api/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan
            });
            await dispatch(checkAuth());
            setPaymentMessage('Payment successful! Subscription activated.');
          } catch (err) {
            setPaymentMessage('Payment verification failed on server.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
          email: user?.emailId
        },
        notes: {
          plan
        },
        theme: {
          color: '#3B82F6' // Brand color
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on?.('payment.failed', () => {
        setPaymentMessage('Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setPaymentMessage('Unable to start payment, try again.');
      setLoading(false);
    }
  };

  const buttonText = plan === 'monthly' ? 'Start Monthly Plan' : 'Start Yearly Plan';
  const price = plan === 'monthly' ? '₹1/month' : '₹6/year';

  return (
    <>
      <button 
        disabled={loading} 
        onClick={handlePay} 
        className="w-full bg-brand hover:bg-brand-hover text-inverse py-3 px-6 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-inverse mr-2"></div>
            Processing...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span>{buttonText}</span>
            <span className="ml-2 text-sm opacity-90">({price})</span>
          </div>
        )}
      </button>
      {paymentMessage && (
        <p className="mt-3 text-sm text-center text-secondary">{paymentMessage}</p>
      )}
    </>
  );
}
