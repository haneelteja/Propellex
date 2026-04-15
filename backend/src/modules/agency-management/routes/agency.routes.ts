import express from 'express'
import {
  getAgencyProfile,
  updateAgencyProfile,
  getAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  getListings,
  getPerformance,
} from '../controllers/agency.controller.js'
import { authenticate, authorize } from '../../../shared/middleware/auth.middleware.js'

const router = express.Router()

// All routes require authentication and Agency Admin role
router.use(authenticate)
router.use(authorize('agency_admin'))

router.get('/profile', getAgencyProfile)
router.put('/profile', updateAgencyProfile)
router.get('/agents', getAgents)
router.post('/agents', createAgent)
router.put('/agents/:id', updateAgent)
router.delete('/agents/:id', deleteAgent)
router.get('/listings', getListings)
router.get('/performance', getPerformance)

export default router




