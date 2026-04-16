import mongoose, { Schema, Document } from 'mongoose'

// Inline types (no external @propellex/shared dependency)
interface IProperty extends Document {
  title: string; description: string; type: string; status: string; price: number
  currency: string; location: Record<string, unknown>; specifications: Record<string, unknown>
  amenities: string[]; images: string[]; virtualTour?: string; documents: unknown[]
  investmentMetrics?: Record<string, unknown>; agency: unknown; agent: unknown
  featured: boolean; views: number
}

const PropertySchema = new Schema<IProperty>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['apartment', 'villa', 'plot', 'commercial', 'luxury_home'], required: true },
    status: { type: String, enum: ['available', 'sold', 'reserved', 'under_construction'], default: 'available' },
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, default: 'India' },
      coordinates: { lat: Number, lng: Number },
      locality: String,
      landmark: String,
    },
    specifications: {
      bedrooms: { type: Number, required: true },
      bathrooms: { type: Number, required: true },
      area: { type: Number, required: true },
      areaUnit: { type: String, enum: ['sqft', 'sqm'], default: 'sqft' },
      yearBuilt: Number,
      parking: Number,
      floors: Number,
      facing: String,
      furnishing: { type: String, enum: ['furnished', 'semi-furnished', 'unfurnished'] },
    },
    amenities: [String],
    images: [String],
    virtualTour: String,
    documents: [{
      name: String,
      url: String,
      type: String,
      uploadedAt: { type: Date, default: Date.now },
    }],
    investmentMetrics: {
      expectedROI: Number,
      rentalYield: Number,
      appreciationRate: Number,
      investmentGrade: { type: String, enum: ['A+', 'A', 'B+', 'B', 'C'] },
      riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
    },
    agency: { type: Schema.Types.ObjectId as unknown as mongoose.SchemaDefinitionType<unknown>, ref: 'Agency', required: true },
    agent: { type: Schema.Types.ObjectId as unknown as mongoose.SchemaDefinitionType<unknown>, ref: 'Agent', required: true },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
)

PropertySchema.index({ 'location.city': 1 })
PropertySchema.index({ type: 1 })
PropertySchema.index({ status: 1 })
PropertySchema.index({ price: 1 })
PropertySchema.index({ featured: 1 })
PropertySchema.index({ 'location.coordinates': '2dsphere' })

export default mongoose.model<IProperty>('Property', PropertySchema)




