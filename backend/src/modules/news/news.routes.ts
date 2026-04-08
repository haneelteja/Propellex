import { Router } from 'express';
import { asyncHandler } from '../../utils/response';
import { optionalAuth, requireAuth, requireRole } from '../../middleware/auth';
import { handleGetNews, handleGetSentimentSummary, handleTriggerFetch, handleGetLocalities } from './news.controller';

export const newsRouter = Router();

newsRouter.get('/',          optionalAuth, asyncHandler(handleGetNews));
newsRouter.get('/sentiment', optionalAuth, asyncHandler(handleGetSentimentSummary));
newsRouter.get('/localities', optionalAuth, asyncHandler(handleGetLocalities));
newsRouter.post('/fetch',    requireAuth, requireRole('admin'), asyncHandler(handleTriggerFetch));
