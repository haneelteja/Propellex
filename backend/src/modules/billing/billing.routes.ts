import { Router, raw } from 'express';
import { asyncHandler } from '../../utils/response';
import { requireAuth } from '../../middleware/auth';
import { handleCreateOrder, handleVerifyPayment, handleWebhookEvent } from './billing.controller';

export const billingRouter = Router();

// Webhook must use raw body parser for signature verification
billingRouter.post(
  '/webhook',
  raw({ type: 'application/json' }),
  asyncHandler(handleWebhookEvent),
);

// Authenticated endpoints
billingRouter.post('/order',          requireAuth, asyncHandler(handleCreateOrder));
billingRouter.post('/verify-payment', requireAuth, asyncHandler(handleVerifyPayment));
