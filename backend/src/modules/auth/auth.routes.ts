import { Router } from 'express';
import { asyncHandler } from '../../utils/response';
import { requireAuth } from '../../middleware/auth';
import {
  handleSendOTP,
  handleVerifyOTP,
  handleGetProfile,
  handleUpdateProfile,
  handleUpgrade,
} from './auth.controller';

export const authRouter = Router();

authRouter.post('/send-otp', asyncHandler(handleSendOTP));
authRouter.post('/verify-otp', asyncHandler(handleVerifyOTP));
authRouter.get('/profile', requireAuth, asyncHandler(handleGetProfile));
authRouter.put('/profile', requireAuth, asyncHandler(handleUpdateProfile));
authRouter.patch('/profile', requireAuth, asyncHandler(handleUpdateProfile));
authRouter.post('/upgrade', requireAuth, asyncHandler(handleUpgrade));
