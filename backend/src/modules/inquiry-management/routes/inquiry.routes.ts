import express from 'express'
import {
  getInquiries,
  createInquiry,
  getInquiryById,
  updateInquiry,
  deleteInquiry,
  getInquiryAnalytics,
} from '../controllers/inquiry.controller.js'
import { authenticate } from '../../../shared/middleware/auth.middleware.js'

const router = express.Router()

router.use(authenticate)

router.get('/', getInquiries)
router.post('/', createInquiry)
router.get('/analytics', getInquiryAnalytics)
router.get('/:id', getInquiryById)
router.put('/:id', updateInquiry)
router.delete('/:id', deleteInquiry)

export default router




