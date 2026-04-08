import crypto from 'crypto';
import Razorpay from 'razorpay';
import { query } from '../../config/db';

const PRO_PRICE_PAISE = 99900; // ₹999 in paise
const CURRENCY        = 'INR';
const PLAN_LABEL      = 'Propellex Pro — Monthly';

function getRazorpay(): Razorpay {
  const key_id     = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error('Razorpay credentials not configured');
  return new Razorpay({ key_id, key_secret });
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

/** Create a one-time Razorpay order for ₹999 Pro subscription. */
export async function createOrder(userId: string): Promise<RazorpayOrder> {
  const rz = getRazorpay();
  const receipt = `propellex_pro_${userId.slice(0, 8)}_${Date.now()}`;

  const order = await rz.orders.create({
    amount:   PRO_PRICE_PAISE,
    currency: CURRENCY,
    receipt,
    notes: { user_id: userId, plan: PLAN_LABEL },
  });

  return {
    id:       order.id,
    amount:   typeof order.amount === 'string' ? parseInt(order.amount, 10) : order.amount,
    currency: order.currency,
    receipt:  typeof order.receipt === 'string' ? order.receipt : receipt,
  };
}

/** Verify payment signature and upgrade user to Pro. */
export async function verifyAndUpgrade(
  userId: string,
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<void> {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('Razorpay secret not configured');

  // HMAC-SHA256 signature verification
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expected !== signature) {
    throw new Error('Payment signature verification failed');
  }

  // Upgrade subscription tier
  await query(
    `UPDATE users SET subscription_tier = 'premium', updated_at = NOW() WHERE id = $1`,
    [userId],
  );

  console.info(`[Billing] User ${userId} upgraded to Pro — payment ${paymentId}`);
}

/** Handle Razorpay webhook for subscription events (cancellation, etc.). */
export async function handleWebhook(
  rawBody: Buffer,
  webhookSignature: string,
): Promise<void> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[Billing] RAZORPAY_WEBHOOK_SECRET not set — skipping webhook verification');
    return;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (expected !== webhookSignature) {
    throw new Error('Webhook signature mismatch');
  }

  let event: { event: string; payload?: { payment?: { entity?: { notes?: { user_id?: string } } } } };
  try {
    event = JSON.parse(rawBody.toString());
  } catch {
    throw new Error('Invalid webhook JSON');
  }

  const eventType = event.event;
  const userId = event.payload?.payment?.entity?.notes?.user_id;

  console.info(`[Billing] Webhook: ${eventType}`, userId ? `— user ${userId}` : '');

  if (eventType === 'payment.captured' && userId) {
    await query(
      `UPDATE users SET subscription_tier = 'premium', updated_at = NOW() WHERE id = $1`,
      [userId],
    );
    console.info(`[Billing] Webhook: upgraded user ${userId} to Premium`);
  }
}
