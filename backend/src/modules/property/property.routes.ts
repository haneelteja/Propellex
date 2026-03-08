import { Router } from 'express';
import { asyncHandler } from '../../utils/response';
import { requireAuth, optionalAuth, requireRole } from '../../middleware/auth';
import { freemiumGate } from '../../middleware/freemium';
import {
  handleSearch,
  handleGetOne,
  handleComparables,
  handleAnalysis,
  handleAiAnalyze,
  handleCreate,
  handleUpdate,
  handleDelete,
} from './property.controller';

export const propertyRouter = Router();

propertyRouter.get('/', optionalAuth, freemiumGate('search'), asyncHandler(handleSearch));
propertyRouter.post('/', requireAuth, requireRole('admin', 'manager'), asyncHandler(handleCreate));
propertyRouter.get('/:id', optionalAuth, asyncHandler(handleGetOne));
propertyRouter.get('/:id/comparables', optionalAuth, asyncHandler(handleComparables));
propertyRouter.get('/:id/analysis', requireAuth, asyncHandler(handleAnalysis));
propertyRouter.post('/:id/ai-analyze', requireAuth, requireRole('admin', 'manager'), asyncHandler(handleAiAnalyze));
propertyRouter.put('/:id', requireAuth, requireRole('admin', 'manager'), asyncHandler(handleUpdate));
propertyRouter.delete('/:id', requireAuth, requireRole('admin', 'manager'), asyncHandler(handleDelete));
