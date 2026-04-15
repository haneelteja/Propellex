import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../../modules/auth/models/User.model.js'

export interface AuthRequest extends Request {
  user?: any
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }

    const JWT_SECRET = process.env.JWT_SECRET || process.env.AZURE_KEY_VAULT_SECRET || 'your-secret-key'
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

    const user = await User.findById(decoded.userId).select('-password')

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' })
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'Account is inactive' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    next()
  }
}




