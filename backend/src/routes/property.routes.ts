import express from 'express'
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  searchProperties,
  getFeaturedProperties,
  incrementViews,
} from '../controllers/property.controller.js'
import { authenticate, authorize } from '../middleware/auth.middleware.js'

const router = express.Router()

// Public routes
router.get('/', getProperties)
router.get('/search', searchProperties)
router.get('/featured', getFeaturedProperties)
router.get('/:id', getPropertyById)
router.patch('/:id/views', incrementViews)

// Admin routes
router.post('/', authenticate, authorize('admin'), createProperty)
router.put('/:id', authenticate, authorize('admin'), updateProperty)
router.delete('/:id', authenticate, authorize('admin'), deleteProperty)

export default router




