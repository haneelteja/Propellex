import mongoose, { Schema, Document } from 'mongoose'

export interface IProperty extends Document {
  title: string
  description: string
  type: 'apartment' | 'house' | 'villa' | 'commercial' | 'land'
  status: 'available' | 'sold' | 'rented' | 'pending'
  price: number
  currency: string
  location: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  specifications: {
    bedrooms: number
    bathrooms: number
    area: number // in square feet/meters
    areaUnit: 'sqft' | 'sqm'
    yearBuilt?: number
    parking?: number
    floors?: number
  }
  amenities: string[]
  images: string[]
  virtualTour?: string
  documents: Array<{
    name: string
    url: string
    type: string
  }>
  agent: mongoose.Types.ObjectId
  featured: boolean
  views: number
  createdAt: Date
  updatedAt: Date
}

const PropertySchema = new Schema<IProperty>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    type: {
      type: String,
      enum: ['apartment', 'house', 'villa', 'commercial', 'land'],
      required: [true, 'Property type is required'],
    },
    status: {
      type: String,
      enum: ['available', 'sold', 'rented', 'pending'],
      default: 'available',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    currency: {
      type: String,
      default: 'USD',
    },
    location: {
      address: {
        type: String,
        required: [true, 'Address is required'],
      },
      city: {
        type: String,
        required: [true, 'City is required'],
      },
      state: {
        type: String,
        required: [true, 'State is required'],
      },
      zipCode: {
        type: String,
        required: [true, 'Zip code is required'],
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        default: 'USA',
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    specifications: {
      bedrooms: {
        type: Number,
        required: [true, 'Number of bedrooms is required'],
        min: [0, 'Bedrooms must be non-negative'],
      },
      bathrooms: {
        type: Number,
        required: [true, 'Number of bathrooms is required'],
        min: [0, 'Bathrooms must be non-negative'],
      },
      area: {
        type: Number,
        required: [true, 'Area is required'],
        min: [0, 'Area must be positive'],
      },
      areaUnit: {
        type: String,
        enum: ['sqft', 'sqm'],
        default: 'sqft',
      },
      yearBuilt: Number,
      parking: {
        type: Number,
        min: [0, 'Parking spaces must be non-negative'],
      },
      floors: {
        type: Number,
        min: [1, 'Floors must be at least 1'],
      },
    },
    amenities: [String],
    images: [String],
    virtualTour: String,
    documents: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Agent is required'],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for faster queries
PropertySchema.index({ 'location.city': 1 })
PropertySchema.index({ type: 1 })
PropertySchema.index({ status: 1 })
PropertySchema.index({ price: 1 })
PropertySchema.index({ featured: 1 })
PropertySchema.index({ createdAt: -1 })
PropertySchema.index({ 'location.coordinates': '2dsphere' }) // For geospatial queries

export default mongoose.model<IProperty>('Property', PropertySchema)




