import { Response } from 'express'
import User from '../models/User.model.js'
import { AuthRequest } from '../middleware/auth.middleware.js'

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json({ users })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch users' })
  }
}

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ user })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch user' })
  }
}

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ message: 'User updated successfully', user })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update user' })
  }
}

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ message: 'User deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete user' })
  }
}




