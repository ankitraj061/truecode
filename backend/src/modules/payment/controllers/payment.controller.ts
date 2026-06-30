import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/payment.js';
import User from '../../user/models/user.js';
import dotenv from 'dotenv';
import { sendError } from '../../../contracts/apiResponse.js';
import { redisClient } from '../../../config/redis.js';
dotenv.config();

// How long a freshly created (unpaid) order can be resumed from "My Transactions".
const PAYMENT_RESERVATION_TTL_SECONDS = 10 * 60; // 10 minutes
const reservationKey = (paymentId: string) => `payment:reserve:${paymentId}`;

const isRazorpayConfigured = () => Boolean(
  process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim()
);

const getRazorpayClient = () => {
  if (!isRazorpayConfigured()) {
    throw new Error('Razorpay is not configured');
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

// Configure your plan amounts (in paise) and durations (days)
const PLANS = {
  monthly: { amount: 100, durationDays: 30 },  // ₹1.00 -> 100 paise
  yearly:  { amount: 600, durationDays: 365 } // ₹6.00 -> 600 paise
};

export const createOrder = async (req, res) => {
  try {
    // Prefer extracting user id from auth middleware (req.user or req.userId)
    const userId = (req.user && req.user._id) || req.body.userId;
    const { plan } = req.body;
    if (!userId) return sendError(res, 401, 'Unauthorized');
    if (!PLANS[plan]) return sendError(res, 400, 'Invalid plan');

    if (!isRazorpayConfigured()) {
      return sendError(res, 503, 'Payment gateway is not configured');
    }

    const { amount } = PLANS[plan];
    const generateShortReceipt = (userId) => {
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits
      const userIdShort = userId.toString().slice(-8); // Convert ObjectId to string first
      return `${userIdShort}_${timestamp}`; // Format: abcdef12_123456 (15 chars)
    };

    const options = {
      amount, // in paise
      currency: 'INR',
      receipt: generateShortReceipt(userId),
      payment_capture: 1
    };

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create(options);

    // Save payment record
    const payment = await Payment.create({
      user: userId,
      plan,
      amount: order.amount,
      currency: order.currency,
      razorpayOrderId: order.id,
      status: 'created'
    });

    // Reserve this order for 10 minutes so the user can resume it from
    // "My Transactions" if they navigate away before completing checkout,
    // instead of silently creating a duplicate order.
    try {
      await redisClient.set(
        reservationKey(payment._id.toString()),
        JSON.stringify({ orderId: order.id, amount: order.amount, currency: order.currency }),
        { ex: PAYMENT_RESERVATION_TTL_SECONDS }
      );
    } catch {
      // Redis is best-effort here — payment still succeeds via Mongo record.
    }

    return res.json({
      success: true,
      order,            // send order.id etc to frontend
      paymentId: payment._id,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    return sendError(res, 500, 'Order creation failed');
  }
};

export const verifyPayment = async (req, res) => {
  try {
    // Data from frontend after checkout success
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan
    } = req.body;

    if (!process.env.RAZORPAY_KEY_SECRET?.trim()) {
      return sendError(res, 503, 'Payment verification is not configured');
    }

    // verify signature using key_secret
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return sendError(res, 400, 'Invalid signature');
    }

    // Atomically transition created/failed/expired/cancelled -> paid; this both
    // prevents a race between concurrent verify calls and guards against
    // re-extending the subscription on a replayed/duplicate verify request.
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, status: { $ne: 'paid' } },
      { razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, status: 'paid' },
      { new: true }
    );

    if (!payment) {
      const existingPayment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
      if (!existingPayment) {
        return sendError(res, 404, 'Order not found');
      }
      // Already verified previously — avoid re-extending the subscription.
      const user = await User.findById(existingPayment.user);
      return res.json({ success: true, message: 'Payment already verified', expiry: user?.subscriptionExpiry });
    }

    // Payment is settled — release the 10-minute resume reservation.
    try {
      await redisClient.del(reservationKey(payment._id.toString()));
    } catch {}

    // Update user's subscriptionExpiry intelligently:
    const user = await User.findById(payment.user);
    const now = new Date();
    const currentExpiry = user?.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
    const startDate = currentExpiry && currentExpiry > now ? currentExpiry : now;

    const durationDays = PLANS[plan]?.durationDays || PLANS['monthly'].durationDays;
    const newExpiry = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, {
      subscriptionType: 'premium',
      subscriptionExpiry: newExpiry
    });

    return res.json({ success: true, message: 'Payment verified and subscription updated', expiry: newExpiry });
  } catch (err) {
    return sendError(res, 500, 'Verification failed');
  }
};

// Webhook handler — use express.raw for body (see below)
export const webhookHandler = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    const signature = req.headers['x-razorpay-signature'];

    if (!webhookSecret) {
      return res.status(503).send('Webhook is not configured');
    }

    // req.body here is the **raw** body (Buffer) because route will use express.raw
    const body = req.body; // Buffer
    const expected = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');

    if (expected !== signature) {
      return res.status(400).send('Invalid signature');
    }

    const event = JSON.parse(body.toString());
    // handle events — example: payment.captured
    if (event.event === 'payment.captured' || event.event === 'payment.authorized') {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      // Only transition created/failed/expired/cancelled -> paid. Razorpay fires both
      // payment.authorized and payment.captured for two-stage captures, and may retry
      // webhook delivery, so this guards against extending the subscription twice.
      const payment = await Payment.findOneAndUpdate(
        { razorpayOrderId: orderId, status: { $ne: 'paid' } },
        { razorpayPaymentId: paymentId, status: 'paid' },
        { new: true }
      );

      if (payment) {
        try {
          await redisClient.del(reservationKey(payment._id.toString()));
        } catch {}

        const user = await User.findById(payment.user);
        const now = new Date();
        const currentExpiry = user?.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
        const startDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
        const durationDays = PLANS[payment.plan].durationDays;
        const newExpiry = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

        await User.findByIdAndUpdate(user._id, {
          subscriptionType: 'premium',
          subscriptionExpiry: newExpiry
        });
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).send('error');
  }
};

// List the current user's payment history (for the "My Transactions" page).
// Flags any still-pending order as `resumable` if its 10-minute Redis
// reservation hasn't expired yet, so the frontend can offer to reopen checkout.
// Any "created" payment whose reservation has lapsed is lazily flipped to
// "expired" here, instead of sitting as "Pending" forever until someone
// happens to click Resume.
export const getMyTransactions = async (req, res) => {
  try {
    const userId = (req.user && req.user._id) || req.body.userId;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const payments = await Payment.find({ user: userId }).sort({ createdAt: -1 });

    const transactions = await Promise.all(
      payments.map(async (payment) => {
        let resumable = false;

        if (payment.status === 'created') {
          let reservationExists: boolean | null = null;
          try {
            reservationExists = Boolean(await redisClient.exists(reservationKey(payment._id.toString())));
          } catch {
            // Redis unreachable — leave status as-is rather than guessing.
            reservationExists = null;
          }

          if (reservationExists === true) {
            resumable = true;
          } else if (reservationExists === false) {
            payment.status = 'expired';
            await payment.save();
          }
        }

        return { ...payment.toObject(), resumable };
      })
    );

    return res.json({ success: true, transactions });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch transactions');
  }
};

// Cancel a still-pending order before it's paid (e.g. user changed their
// mind). Releases the Redis reservation so it can't be resumed afterwards.
export const cancelPayment = async (req, res) => {
  try {
    const userId = (req.user && req.user._id) || req.body.userId;
    const { paymentId } = req.params;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const payment = await Payment.findOne({ _id: paymentId, user: userId });
    if (!payment) return sendError(res, 404, 'Transaction not found');

    if (payment.status !== 'created') {
      return sendError(res, 400, `This payment is already ${payment.status}`);
    }

    payment.status = 'cancelled';
    await payment.save();

    try {
      await redisClient.del(reservationKey(payment._id.toString()));
    } catch {}

    return res.json({ success: true, message: 'Payment cancelled' });
  } catch (err) {
    return sendError(res, 500, 'Unable to cancel payment');
  }
};

// Resume a still-reserved pending order (e.g. user navigated back before
// finishing checkout). Returns the same Razorpay order so a duplicate
// order isn't created; fails once the 10-minute reservation has expired.
export const resumePayment = async (req, res) => {
  try {
    const userId = (req.user && req.user._id) || req.body.userId;
    const { paymentId } = req.params;
    if (!userId) return sendError(res, 401, 'Unauthorized');

    const payment = await Payment.findOne({ _id: paymentId, user: userId });
    if (!payment) return sendError(res, 404, 'Transaction not found');

    if (payment.status !== 'created') {
      return sendError(res, 400, `This payment is already ${payment.status}`);
    }

    let reserved: string | null = null;
    try {
      reserved = await redisClient.get(reservationKey(payment._id.toString()));
    } catch {}

    if (!reserved) {
      payment.status = 'expired';
      await payment.save();
      return sendError(res, 410, 'Payment window expired. Please start a new payment.');
    }

    const data = typeof reserved === 'string' ? JSON.parse(reserved) : reserved;

    return res.json({
      success: true,
      order: { id: data.orderId, amount: data.amount, currency: data.currency },
      paymentId: payment._id,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    return sendError(res, 500, 'Unable to resume payment');
  }
};
