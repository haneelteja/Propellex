import express from 'express'
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/user.controller.js'
import { authenticate, authorize } from '../middleware/auth.middleware.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Admin only routes
router.get('/', authorize('admin'), getUsers)
router.get('/:id', authorize('admin'), getUserById)
router.put('/:id', authorize('admin'), updateUser)
router.delete('/:id', authorize('admin'), deleteUser)

export default router




