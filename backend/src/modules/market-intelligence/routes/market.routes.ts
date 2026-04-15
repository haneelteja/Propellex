import express from 'express'
import {
  getMarketIntelligence,
  getMarketTrends,
  getMarketReports,
  getPricePredictions,
  getComparativeAnalysis,
} from '../controllers/market.controller.js'
import { authenticate } from '../../../shared/middleware/auth.middleware.js'

const router = express.Router()

router.get('/intelligence', authenticate, getMarketIntelligence)
router.get('/trends', authenticate, getMarketTrends)
router.get('/reports', authenticate, getMarketReports)
router.get('/predictions', authenticate, getPricePredictions)
router.post('/comparative-analysis', authenticate, getComparativeAnalysis)

export default router




