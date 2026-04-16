import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.model.js'
import Otp from '../models/Otp.model.js'
import { sendOtpEmail } from '../../../shared/services/email.service.js'
import { AuthRequest } from '../../../shared/middleware/auth.middleware.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d'
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d'

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString()
}

function issueTokens(userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE as any })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refreshToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRE as any })
  return { token, refreshToken }
}

// POST /api/auth/send-otp
// Body: { email, name?, role?, phone? }
// If user exists → login flow (ignore name/role)
// If user doesn't exist → registration flow (requires name)
export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email, name, role, phone } = req.body

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' })
    }

    let user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      // Registration flow
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ success: false, error: 'Name is required for new accounts' })
      }
      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase(),
        role: role || 'hni_investor',
        phone: phone?.trim(),
        isActive: true,
      })
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'Account is inactive' })
    }

    // Invalidate any existing unused OTPs for this email
    await Otp.deleteMany({ email: email.toLowerCase() })

    const code = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await Otp.create({ email: email.toLowerCase(), code, expiresAt })

    await sendOtpEmail(email.toLowerCase(), code)

    res.json({
      success: true,
      message: 'OTP sent to your email',
      isNewUser: !user.createdAt || (Date.now() - user.createdAt.getTime()) < 5000,
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to send OTP' })
  }
}

// POST /api/auth/verify-otp
// Body: { email, code }
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body

    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and code are required' })
    }

    const otp = await Otp.findOne({
      email: email.toLowerCase(),
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 })

    if (!otp) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' })
    }

    if (otp.code !== code.toString()) {
      return res.status(400).json({ success: false, error: 'Incorrect code' })
    }

    // Mark OTP as used
    otp.used = true
    await otp.save()

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    user.lastLogin = new Date()
    await user.save()

    const { token, refreshToken } = issueTokens(user._id.toString())

    res.json({
      success: true,
      message: 'Verified successfully',
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          city: user.city,
        },
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Verification failed' })
  }
}

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('-password')
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }
    res.json({ success: true, data: { user } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to get profile' })
  }
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, avatar, city } = req.body
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { name, phone, avatar, city },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }
    res.json({ success: true, message: 'Profile updated successfully', data: { user } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update profile' })
  }
}

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'Refresh token required' })
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string }
    const user = await User.findById(decoded.userId)

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRE as any })
    res.json({ success: true, data: { token } })
  } catch (error: any) {
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token' })
  }
}
