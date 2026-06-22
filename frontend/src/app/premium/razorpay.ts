export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

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
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayInstance {
  open(): void;
  on?(event: string, handler: () => void): void;
}

export function loadRazorpayScript() {
  if (!document.querySelector('#razorpay-script')) {
    const s = document.createElement('script');
    s.id = 'razorpay-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    document.body.appendChild(s);
  }
}

interface OpenCheckoutArgs {
  order: RazorpayOrder;
  key: string;
  plan: 'monthly' | 'yearly';
  prefill: { name?: string; email?: string };
  onSuccess: (response: RazorpayResponse) => Promise<void> | void;
  onFailure: () => void;
  onDismiss?: () => void;
}

/** Opens the Razorpay checkout widget — this renders as a modal overlay on top of the current page. */
export function openRazorpayCheckout({
  order,
  key,
  plan,
  prefill,
  onSuccess,
  onFailure,
  onDismiss,
}: OpenCheckoutArgs): boolean {
  if (typeof window === 'undefined' || typeof window.Razorpay !== 'function') {
    return false;
  }

  const options: RazorpayOptions = {
    key,
    amount: order.amount,
    currency: order.currency,
    name: 'TrueCode',
    description: `Subscription: ${plan}`,
    order_id: order.id,
    handler: onSuccess,
    prefill,
    notes: { plan },
    theme: { color: '#3B82F6' },
    modal: { ondismiss: onDismiss },
  };

  const rzp = new window.Razorpay(options);
  rzp.on?.('payment.failed', onFailure);
  rzp.open();
  return true;
}
