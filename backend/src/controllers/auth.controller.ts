import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.model.js'
import { AuthRequest } from '../middleware/auth.middleware.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d'

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'client',
      phone,
    })

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRE,
    })

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Registration failed' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRE,
    })

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
      },
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Login failed' })
  }
}

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ user })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get user' })
  }
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, avatar } = req.body
    const userId = req.user?._id

    const user = await User.findByIdAndUpdate(
      userId,
      { name, phone, avatar },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ message: 'Profile updated successfully', user })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update profile' })
  }
}




