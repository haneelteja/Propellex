// ─── User Types ──────────────────────────────────────────────────────────────

export type UserRole = 'hni_investor' | 'agency_admin' | 'compliance_officer' | 'product_manager'

export interface User {
  _id: string
  email: string
  name: string
  role: UserRole
  phone?: string
  avatar?: string
  city?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ─── Property Types ───────────────────────────────────────────────────────────

export type PropertyType = 'apartment' | 'villa' | 'plot' | 'commercial' | 'luxury_home'
export type PropertyStatus = 'available' | 'sold' | 'reserved' | 'under_construction'

export interface Property {
  _id: string
  title: string
  description: string
  type: PropertyType
  status: PropertyStatus
  price: number
  currency: string
  location: PropertyLocation
  specifications: PropertySpecifications
  amenities: string[]
  images: string[]
  virtualTour?: string
  documents: PropertyDocument[]
  investmentMetrics: InvestmentMetrics
  agency: string
  agent: string
  featured: boolean
  views: number
  createdAt: Date
  updatedAt: Date
}

export interface PropertyLocation {
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  coordinates?: { lat: number; lng: number }
  locality?: string
  landmark?: string
}

export interface PropertySpecifications {
  bedrooms: number
  bathrooms: number
  area: number
  areaUnit: 'sqft' | 'sqm'
  yearBuilt?: number
  parking?: number
  floors?: number
  facing?: string
  furnishing?: 'furnished' | 'semi-furnished' | 'unfurnished'
}

export interface InvestmentMetrics {
  expectedROI?: number
  rentalYield?: number
  appreciationRate?: number
  investmentGrade?: 'A+' | 'A' | 'B+' | 'B' | 'C'
  riskLevel?: 'low' | 'medium' | 'high'
}

export interface PropertyDocument {
  name: string
  url: string
  type: string
  uploadedAt: Date
}

// ─── Agency / Agent Types ─────────────────────────────────────────────────────

export interface Agency {
  _id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  licenseNumber: string
  isActive: boolean
  agents: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Agent {
  _id: string
  name: string
  email: string
  phone: string
  agency: string
  licenseNumber?: string
  specialties: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ─── Investment / Portfolio Types ─────────────────────────────────────────────

export interface Investment {
  _id: string
  investor: string
  property: string
  amount: number
  currency: string
  investmentDate: Date
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  returns?: number
  documents: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Portfolio {
  investor: string
  totalInvestments: number
  activeInvestments: number
  totalValue: number
  totalReturns: number
  roi: number
  properties: string[]
}

// ─── Inquiry Types ────────────────────────────────────────────────────────────

export interface Inquiry {
  _id: string
  property: string
  investor: string
  agent?: string
  agency?: string
  type: 'viewing' | 'investment' | 'information' | 'general'
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed'
  priority: 'low' | 'medium' | 'high'
  notes: string
  followUpDate?: Date
  createdAt: Date
  updatedAt: Date
}

// ─── Compliance Types ─────────────────────────────────────────────────────────

export interface ComplianceRecord {
  _id: string
  property: string
  type: 'legal' | 'regulatory' | 'tax' | 'environmental'
  status: 'pending' | 'verified' | 'rejected' | 'expired'
  documents: string[]
  verifiedBy?: string
  verifiedAt?: Date
  expiryDate?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// ─── Market Intelligence Types ────────────────────────────────────────────────

export interface MarketData {
  _id: string
  city: string
  locality?: string
  propertyType: PropertyType
  averagePrice: number
  pricePerSqft: number
  priceTrend: 'up' | 'down' | 'stable'
  demandIndex: number
  supplyIndex: number
  rentalYield: number
  appreciationRate: number
  dataDate: Date
  source: string
}

export interface MarketReport {
  _id: string
  title: string
  city: string
  reportType: 'quarterly' | 'annual' | 'custom'
  data: MarketData[]
  insights: string[]
  generatedAt: Date
  generatedBy: string
}

// ─── Notification Types ───────────────────────────────────────────────────────

export interface Notification {
  _id: string
  user: string
  type: 'property' | 'investment' | 'inquiry' | 'compliance' | 'system'
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: Date
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: PaginationMeta
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

// ─── Filter / Search Types ────────────────────────────────────────────────────

export interface PropertyFilters {
  city?: string
  type?: PropertyType
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  minArea?: number
  maxArea?: number
  amenities?: string[]
  investmentGrade?: string
  riskLevel?: string
  status?: PropertyStatus
}

export interface SearchParams extends PropertyFilters {
  query?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const USER_ROLES = {
  HNI_INVESTOR: 'hni_investor',
  AGENCY_ADMIN: 'agency_admin',
  COMPLIANCE_OFFICER: 'compliance_officer',
  PRODUCT_MANAGER: 'product_manager',
} as const

export const PROPERTY_TYPES = {
  APARTMENT: 'apartment',
  VILLA: 'villa',
  PLOT: 'plot',
  COMMERCIAL: 'commercial',
  LUXURY_HOME: 'luxury_home',
} as const

export const PROPERTY_STATUS = {
  AVAILABLE: 'available',
  SOLD: 'sold',
  RESERVED: 'reserved',
  UNDER_CONSTRUCTION: 'under_construction',
} as const

export const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
  'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
  'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad',
] as const

export const INVESTMENT_GRADES = ['A+', 'A', 'B+', 'B', 'C'] as const
export const RISK_LEVELS = ['low', 'medium', 'high'] as const

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

// ─── Utils ────────────────────────────────────────────────────────────────────

export const formatCurrency = (amount: number, currency = 'INR'): string => {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

export const calculateROI = (investment: number, returns: number): number =>
  ((returns - investment) / investment) * 100

export const calculatePricePerSqft = (price: number, area: number): number =>
  Math.round(price / area)

export const formatArea = (area: number, unit: 'sqft' | 'sqm' = 'sqft'): string =>
  `${area.toLocaleString('en-IN')} ${unit}`

export const hasPermission = (userRole: string, requiredRoles: string[]): boolean =>
  requiredRoles.includes(userRole)
