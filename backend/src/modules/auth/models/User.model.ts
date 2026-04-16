import mongoose, { Schema, Document } from 'mongoose'

export type UserRole = 'hni_investor' | 'agency_admin' | 'compliance_officer' | 'product_manager'

export interface IUser extends Document {
  name: string
  email: string
  password?: string
  role: UserRole
  phone?: string
  avatar?: string
  city?: string
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ['hni_investor', 'agency_admin', 'compliance_officer', 'product_manager'],
      default: 'hni_investor',
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    city: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

UserSchema.index({ email: 1 })
UserSchema.index({ role: 1 })
UserSchema.index({ city: 1 })

export default mongoose.model<IUser>('User', UserSchema)
