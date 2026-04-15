// User Roles
export const USER_ROLES = {
  HNI_INVESTOR: 'hni_investor',
  AGENCY_ADMIN: 'agency_admin',
  COMPLIANCE_OFFICER: 'compliance_officer',
  PRODUCT_MANAGER: 'product_manager',
} as const

// Property Types
export const PROPERTY_TYPES = {
  APARTMENT: 'apartment',
  VILLA: 'villa',
  PLOT: 'plot',
  COMMERCIAL: 'commercial',
  LUXURY_HOME: 'luxury_home',
} as const

// Property Status
export const PROPERTY_STATUS = {
  AVAILABLE: 'available',
  SOLD: 'sold',
  RESERVED: 'reserved',
  UNDER_CONSTRUCTION: 'under_construction',
} as const

// Indian Cities (Major cities for HNI investment)
export const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Surat',
  'Lucknow',
  'Kanpur',
  'Nagpur',
  'Indore',
  'Thane',
  'Bhopal',
  'Visakhapatnam',
  'Patna',
  'Vadodara',
  'Ghaziabad',
] as const

// Indian States
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const

// Currency
export const CURRENCY = {
  INR: 'INR',
  USD: 'USD',
} as const

// Investment Grades
export const INVESTMENT_GRADES = ['A+', 'A', 'B+', 'B', 'C'] as const

// Risk Levels
export const RISK_LEVELS = ['low', 'medium', 'high'] as const

// Inquiry Types
export const INQUIRY_TYPES = {
  VIEWING: 'viewing',
  INVESTMENT: 'investment',
  INFORMATION: 'information',
  GENERAL: 'general',
} as const

// Inquiry Status
export const INQUIRY_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  CONVERTED: 'converted',
  CLOSED: 'closed',
} as const

// Compliance Types
export const COMPLIANCE_TYPES = {
  LEGAL: 'legal',
  REGULATORY: 'regulatory',
  TAX: 'tax',
  ENVIRONMENTAL: 'environmental',
} as const

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
  },
  PROPERTIES: {
    BASE: '/api/properties',
    SEARCH: '/api/properties/search',
    DETAILS: (id: string) => `/api/properties/${id}`,
    COMPARE: '/api/properties/compare',
    RECOMMENDATIONS: '/api/properties/recommendations',
  },
  INVESTOR: {
    DASHBOARD: '/api/investor/dashboard',
    PORTFOLIO: '/api/investor/portfolio',
    INVESTMENTS: '/api/investor/investments',
    WATCHLIST: '/api/investor/watchlist',
  },
  AGENCY: {
    BASE: '/api/agency',
    AGENTS: '/api/agency/agents',
    LISTINGS: '/api/agency/listings',
    PERFORMANCE: '/api/agency/performance',
  },
  MARKET: {
    INTELLIGENCE: '/api/market/intelligence',
    TRENDS: '/api/market/trends',
    REPORTS: '/api/market/reports',
    PREDICTIONS: '/api/market/predictions',
  },
  COMPLIANCE: {
    BASE: '/api/compliance',
    RECORDS: '/api/compliance/records',
    VERIFY: '/api/compliance/verify',
    REPORTS: '/api/compliance/reports',
  },
  INQUIRIES: {
    BASE: '/api/inquiries',
    CREATE: '/api/inquiries',
    UPDATE: (id: string) => `/api/inquiries/${id}`,
    LIST: '/api/inquiries',
  },
} as const

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

// File Upload Limits
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const




