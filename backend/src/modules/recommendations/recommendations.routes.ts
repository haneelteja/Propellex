import { Router } from 'express';
import { asyncHandler, ok } from '../../utils/response';
import { requireAuth } from '../../middleware/auth';
import { getRecommendations, saveFeedback } from './recommendations.service';

export const recommendationsRouter = Router();

recommendationsRouter.use(requireAuth);

recommendationsRouter.post('/', asyncHandler(async (req, res) => {
  const { limit } = req.body as { limit?: number };
  const data = await getRecommendations(req.user!.userId, limit ?? 20);
  ok(res, data);
}));

recommendationsRouter.post('/feedback', asyncHandler(async (req, res) => {
  const { property_id, feedback } = req.body as { property_id?: string; feedback?: 'up' | 'down' };
  if (!property_id || !feedback || !['up', 'down'].includes(feedback)) {
    res.status(400).json({ success: false, error: 'property_id and feedback (up/down) required' });
    return;
  }
  await saveFeedback(req.user!.userId, property_id, feedback);
  ok(res, { message: 'Feedback saved' });
}));
