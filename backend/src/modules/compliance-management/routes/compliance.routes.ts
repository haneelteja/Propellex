import express from 'express'
import {
  getComplianceRecords,
  createComplianceRecord,
  updateComplianceRecord,
  verifyCompliance,
  getComplianceReports,
} from '../controllers/compliance.controller.js'
import { authenticate, authorize } from '../../../shared/middleware/auth.middleware.js'

const router = express.Router()

router.use(authenticate)

router.get('/records', getComplianceRecords)
router.post('/records', authorize('compliance_officer', 'product_manager'), createComplianceRecord)
router.put('/records/:id', authorize('compliance_officer', 'product_manager'), updateComplianceRecord)
router.post('/verify/:id', authorize('compliance_officer'), verifyCompliance)
router.get('/reports', authorize('compliance_officer', 'product_manager'), getComplianceReports)

export default router




