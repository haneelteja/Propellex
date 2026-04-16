import mongoose, { Schema, Document } from 'mongoose'

export interface IOtp extends Document {
  email: string
  code: string
  expiresAt: Date
  used: boolean
}

const OtpSchema = new Schema<IOtp>({
  email: { type: String, required: true, lowercase: true, trim: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
})

// Auto-delete documents after expiresAt
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
OtpSchema.index({ email: 1 })

export default mongoose.model<IOtp>('Otp', OtpSchema)
