// Format currency for Indian market
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

// Format date for Indian locale
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

// Calculate ROI
export const calculateROI = (investment: number, returns: number): number => {
  return ((returns - investment) / investment) * 100
}

// Validate Indian phone number
export const validateIndianPhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}

// Validate Indian PIN code
export const validateIndianPIN = (pin: string): boolean => {
  const pinRegex = /^[1-9][0-9]{5}$/
  return pinRegex.test(pin)
}

// Get city from address
export const extractCity = (address: string): string | null => {
  // Simple extraction - can be enhanced with NLP
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata']
  for (const city of cities) {
    if (address.toLowerCase().includes(city.toLowerCase())) {
      return city
    }
  }
  return null
}

// Generate property slug
export const generatePropertySlug = (title: string, city: string): string => {
  return `${title.toLowerCase().replace(/\s+/g, '-')}-${city.toLowerCase()}-${Date.now()}`
}

// Check if user has permission
export const hasPermission = (userRole: string, requiredRoles: string[]): boolean => {
  return requiredRoles.includes(userRole)
}

// Format area
export const formatArea = (area: number, unit: 'sqft' | 'sqm' = 'sqft'): string => {
  return `${area.toLocaleString('en-IN')} ${unit}`
}

// Calculate price per sqft
export const calculatePricePerSqft = (price: number, area: number): number => {
  return Math.round(price / area)
}




