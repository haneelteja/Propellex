import { Router } from 'express';
import { asyncHandler } from '../../utils/response';
import { requireAuth, optionalAuth } from '../../middleware/auth';
import { freemiumGate } from '../../middleware/freemium';
import {
  handleSearch,
  handleGetOne,
  handleComparables,
  handleAnalysis,
} from './property.controller';

export const propertyRouter = Router();

propertyRouter.get('/', optionalAuth, freemiumGate('search'), asyncHandler(handleSearch));
propertyRouter.get('/:id', optionalAuth, asyncHandler(handleGetOne));
propertyRouter.get('/:id/comparables', optionalAuth, asyncHandler(handleComparables));
propertyRouter.get('/:id/analysis', requireAuth, asyncHandler(handleAnalysis));
