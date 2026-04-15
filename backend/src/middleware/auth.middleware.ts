import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User, { IUser } from '../models/User.model.js'

export interface AuthRequest extends Request {
  user?: IUser
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

    const user = await User.findById(decoded.userId).select('-password')

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    next()
  }
}




