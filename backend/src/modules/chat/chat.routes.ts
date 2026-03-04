import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { handleChat, handleChatUsage } from './chat.controller';

export const chatRouter = Router();

chatRouter.use(requireAuth);
chatRouter.post('/', handleChat);        // SSE stream — no asyncHandler wrapper
chatRouter.get('/usage', handleChatUsage);
