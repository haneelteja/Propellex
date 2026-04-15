import express from 'express'
import {
  getProperties,
  getPropertyById,
  searchProperties,
  getRecommendations,
  compareProperties,
  getFeaturedProperties,
} from '../controllers/property.controller.js'
import { authenticate } from '../../../shared/middleware/auth.middleware.js'

const router = express.Router()

router.get('/', getProperties)
router.get('/search', searchProperties)
router.get('/featured', getFeaturedProperties)
router.get('/recommendations', authenticate, getRecommendations)
router.post('/compare', compareProperties)
router.get('/:id', getPropertyById)

export default router




