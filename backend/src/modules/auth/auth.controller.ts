import type { Request, Response } from 'express';
import { sendOTP, verifyOTP, getProfile, updateProfile } from './auth.service';
import { ok, fail } from '../../utils/response';

export async function handleSendOTP(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail(res, 'Valid email required');
    return;
  }
  await sendOTP(email.toLowerCase().trim());
  ok(res, { message: 'OTP sent to your email' });
}

export async function handleVerifyOTP(req: Request, res: Response): Promise<void> {
  const { email, otp } = req.body as { email?: string; otp?: string };
  if (!email || !otp) {
    fail(res, 'Email and OTP are required');
    return;
  }
  const result = await verifyOTP(email.toLowerCase().trim(), otp.trim());
  ok(res, result, 200);
}

export async function handleGetProfile(req: Request, res: Response): Promise<void> {
  const user = await getProfile(req.user!.userId);
  ok(res, user);
}

export async function handleUpdateProfile(req: Request, res: Response): Promise<void> {
  const updated = await updateProfile(req.user!.userId, req.body as Parameters<typeof updateProfile>[1]);
  ok(res, updated);
}
