import type {
  ApiResponse,
  PaginatedResponse,
  Property,
  PropertyFilters,
  ScoredProperty,
  PortfolioItem,
  PortfolioIntent,
  InvestmentAnalysis,
  MarketNews,
  User,
  UserPreferences,
  AgencyPropertyForm,
} from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('propellex_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string } };
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.error ?? 'Request failed');
  }
  return json.data;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  sendOtp: (email: string) =>
    request<{ message: string }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, code: string) =>
    request<{ token: string; user: User }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp: code }),
    }),

  getProfile: () => request<User>('/api/auth/profile'),

  updateProfile: (data: Partial<Pick<User, 'name' | 'user_type'>> & { preferences?: UserPreferences }) =>
    request<User>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ── Properties ────────────────────────────────────────────────────────────────

function buildQuery(filters: Partial<PropertyFilters> & { page?: number; limit?: number }): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== undefined && v !== null) {
      params.set(k, String(v));
    }
  });
  return params.toString() ? `?${params.toString()}` : '';
}

export const properties = {
  search: (filters: Partial<PropertyFilters> & { page?: number; limit?: number }) =>
    fetch(`${BASE_URL}/api/properties${buildQuery(filters)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
    })
      .then((r) => r.json())
      .then((j: PaginatedResponse<Property>) => j),

  getById: (id: string) => request<Property>(`/api/properties/${id}`),

  getAnalysis: (id: string) =>
    request<InvestmentAnalysis>(`/api/properties/${id}/analysis`),

  // Agency manager: create / update / delete
  create: (data: AgencyPropertyForm) =>
    request<Property>('/api/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<AgencyPropertyForm>) =>
    request<Property>(`/api/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    request<{ message: string }>(`/api/properties/${id}`, { method: 'DELETE' }),
};

// ── Recommendations ───────────────────────────────────────────────────────────

export const recommendations = {
  getScored: (preferences: UserPreferences, limit = 20) =>
    request<ScoredProperty[]>('/api/recommendations', {
      method: 'POST',
      body: JSON.stringify({ preferences, limit }),
    }),
};

// ── Portfolio ─────────────────────────────────────────────────────────────────

export const portfolio = {
  list: () => request<PortfolioItem[]>('/api/portfolio'),

  add: (property_id: string, intent: PortfolioIntent, notes = '') =>
    request<PortfolioItem>('/api/portfolio', {
      method: 'POST',
      body: JSON.stringify({ property_id, intent, notes }),
    }),

  update: (id: string, data: { intent?: PortfolioIntent; notes?: string }) =>
    request<PortfolioItem>(`/api/portfolio/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    request<{ message: string }>(`/api/portfolio/${id}`, { method: 'DELETE' }),
};

// ── Market Intelligence ───────────────────────────────────────────────────────

export const market = {
  getNews: (locality?: string, limit = 10) =>
    request<MarketNews[]>(`/api/properties/market/news${buildQuery({ locality, limit } as Record<string, string | number | undefined>)}`),
};

export { ApiError };
