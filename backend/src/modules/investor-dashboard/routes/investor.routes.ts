import express from 'express'
import {
  getDashboard,
  getPortfolio,
  getInvestments,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '../controllers/investor.controller.js'
import { authenticate, authorize } from '../../../shared/middleware/auth.middleware.js'

const router = express.Router()

// All routes require authentication and HNI Investor role
router.use(authenticate)
router.use(authorize('hni_investor'))

router.get('/dashboard', getDashboard)
router.get('/portfolio', getPortfolio)
router.get('/investments', getInvestments)
router.get('/watchlist', getWatchlist)
router.post('/watchlist', addToWatchlist)
router.delete('/watchlist/:propertyId', removeFromWatchlist)

export default router




