import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.model.js'
import { AuthRequest } from '../../../shared/middleware/auth.middleware.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d'
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d'

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone, city } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'hni_investor',
      phone,
      city,
    })

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRE })
    const refreshToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRE })

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          city: user.city,
        },
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Registration failed' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'Account is inactive' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    user.lastLogin = new Date()
    await user.save()

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRE })
    const refreshToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRE })

    res.json({
      success: true,
      message: 'Login successful',
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
    res.status(500).json({ success: false, error: error.message || 'Login failed' })
  }
}

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('-password')
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    res.json({
      success: true,
      data: { user },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to get profile' })
  }
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, avatar, city } = req.body
    const userId = req.user?._id

    const user = await User.findByIdAndUpdate(
      userId,
      { name, phone, avatar, city },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    })
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

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRE })

    res.json({
      success: true,
      data: { token },
    })
  } catch (error: any) {
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token' })
  }
}




