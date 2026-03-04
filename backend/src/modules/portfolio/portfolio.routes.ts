import { Router } from 'express';
import { asyncHandler, ok } from '../../utils/response';
import { requireAuth } from '../../middleware/auth';
import { freemiumGate } from '../../middleware/freemium';
import {
  getPortfolio,
  addToPortfolio,
  updatePortfolioItem,
  removeFromPortfolio,
} from './portfolio.service';

export const portfolioRouter = Router();

portfolioRouter.use(requireAuth);

portfolioRouter.get('/', asyncHandler(async (req, res) => {
  const data = await getPortfolio(req.user!.userId);
  ok(res, data);
}));

portfolioRouter.post('/', freemiumGate('save'), asyncHandler(async (req, res) => {
  const { property_id } = req.body as { property_id?: string };
  if (!property_id) { res.status(400).json({ success: false, error: 'property_id required' }); return; }
  const item = await addToPortfolio(req.user!.userId, property_id, req.user!.subscriptionTier);
  ok(res, item, 201);
}));

portfolioRouter.put('/:id', asyncHandler(async (req, res) => {
  const item = await updatePortfolioItem(req.user!.userId, req.params.id!, req.body as Parameters<typeof updatePortfolioItem>[2]);
  ok(res, item);
}));

portfolioRouter.delete('/:id', asyncHandler(async (req, res) => {
  await removeFromPortfolio(req.user!.userId, req.params.id!);
  ok(res, { message: 'Removed from shortlist' });
}));
