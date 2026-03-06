// ── Auth ─────────────────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type UserType = 'resident_hni' | 'nri' | 'institutional' | 'home_buyer' | 'agency_manager';
export type UserRole = 'client' | 'admin' | 'manager';
export type RiskAppetite = 'low' | 'medium' | 'high';

export interface UserPreferences {
  budget_min: number;       // rupees
  budget_max: number;       // rupees
  localities: string[];
  property_types: PropertyType[];
  roi_target: number;       // percent
  risk_appetite: RiskAppetite;
}

export interface User {
  id: string;
  email: string;
  name: string;
  user_type: UserType;
  role: UserRole;
  subscription_tier: SubscriptionTier;
  preferences: UserPreferences;
  is_active: boolean;
  created_at: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

// ── Property ─────────────────────────────────────────────────────────────────

export type PropertyType = 'residential' | 'commercial' | 'plot';
export type PropertyStatus = 'ready_to_move' | 'under_construction';
export type ReraStatus = 'verified' | 'pending' | 'flagged';

export interface Property {
  id: string;
  rera_number: string;
  rera_status: ReraStatus;
  title: string;
  description: string;
  property_type: PropertyType;
  status: PropertyStatus;
  price: number;            // rupees (converted from paise by backend)
  price_per_sqft: number;   // rupees
  area_sqft: number;
  bedrooms: number | null;
  bathrooms: number | null;
  locality: string;
  city: string;
  lat: number;
  lng: number;
  pincode: string;
  amenities: string[];
  builder_name: string;
  photos: string[];
  risk_score: number;       // 0–100
  roi_estimate_3yr: string; // e.g. "12.5"
  is_active: boolean;
  published_at: string;
  agency_id: string;
}

export interface ScoredProperty extends Property {
  match_score: number;       // 0–100
  why_recommended: string;   // top-scoring factor label
}

export interface PropertyFilters {
  query: string;
  property_type: PropertyType | '';
  status: PropertyStatus | '';
  locality: string;
  bedrooms: number | '';
  price_min: number | '';
  price_max: number | '';
  rera_status: ReraStatus | '';
  sort: 'price_asc' | 'price_desc' | 'area_desc' | 'published_desc';
}

// ── Manager / Admin ───────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

// ── Agency ────────────────────────────────────────────────────────────────────

export interface AgencyPropertyForm {
  title: string;
  description?: string;
  property_type: PropertyType;
  status: PropertyStatus;
  price_cr: number;
  area_sqft: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  locality: string;
  pincode?: string;
  amenities?: string[];
  builder_name?: string;
  rera_number?: string;
  photos?: string[];
}

export interface PropertySearchResult {
  data: Property[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// ── Portfolio ─────────────────────────────────────────────────────────────────

export type PortfolioIntent = 'buy' | 'invest' | 'watch';

export interface PortfolioItem {
  id: string;
  user_id: string;
  property_id: string;
  intent: PortfolioIntent;
  notes: string;
  added_at: string;
  property: Property;
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
}

// ── Market Intelligence ───────────────────────────────────────────────────────

export type NewsCategory = 'price' | 'infra' | 'policy' | 'news';
export type NewsSentiment = 'positive' | 'neutral' | 'negative';

export interface MarketNews {
  id: string;
  title: string;
  summary: string;
  source_name: string;
  category: NewsCategory;
  locality_tags: string[];
  sentiment: NewsSentiment;
  published_at: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface InvestmentAnalysis {
  price: number;
  price_per_sqft: number;
  roi_estimate_3yr: string;
  risk_score: number;
  risk_label: 'Low' | 'Medium' | 'High';
  price_trend: Array<{ month: string; avg_price_per_sqft: number }>;
  comparables: Property[];
}
