import express from 'express'
import { sendOtp, verifyOtp, getProfile, updateProfile, refreshToken } from '../controllers/auth.controller.js'
import { authenticate } from '../../../shared/middleware/auth.middleware.js'

const router = express.Router()

router.post('/send-otp', sendOtp)
router.post('/verify-otp', verifyOtp)
router.post('/refresh', refreshToken)
router.get('/profile', authenticate, getProfile)
router.put('/profile', authenticate, updateProfile)

export default router
