import type { Request, Response } from 'express';
import { ok, AppError } from '../../utils/response';
import { createOrder, verifyAndUpgrade, handleWebhook } from './billing.service';

export async function handleCreateOrder(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  // Block if already on premium
  if (req.user!.subscriptionTier === 'premium') {
    throw new AppError('Already on Premium plan', 400);
  }

  const order = await createOrder(userId);
  ok(res, {
    order_id:   order.id,
    amount:     order.amount,
    currency:   order.currency,
    key_id:     process.env.RAZORPAY_KEY_ID ?? '',
  });
}

export async function handleVerifyPayment(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError('Missing payment fields', 400);
  }

  await verifyAndUpgrade(userId, razorpay_order_id, razorpay_payment_id, razorpay_signature);
  ok(res, { message: 'Payment verified — you are now on Premium!', subscription_tier: 'premium' });
}

export async function handleWebhookEvent(req: Request, res: Response): Promise<void> {
  const sig = req.headers['x-razorpay-signature'];
  if (typeof sig !== 'string') {
    res.status(400).json({ success: false, error: 'Missing webhook signature' });
    return;
  }

  // raw body is set by billing.routes.ts (express.raw middleware)
  const rawBody = req.body as Buffer;
  await handleWebhook(rawBody, sig);

  res.status(200).json({ success: true });
}
