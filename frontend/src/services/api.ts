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
  AdminUser,
  CompareResult,
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
  } catch (err) {
    console.warn('[API] Failed to parse auth token from localStorage:', err);
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    ...authHeaders(),
  };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (err) {
    // Network-level failure (no connection, DNS, CORS preflight)
    const msg = (err as Error).message ?? String(err);
    console.error(`[API] Network error on ${path}:`, msg);
    throw new ApiError(0, 'Cannot reach the server — check your connection');
  }

  // Parse response body safely — server may return HTML on 502/503
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    console.error(`[API] Non-JSON response from ${path} — status ${res.status}`);
    throw new ApiError(res.status, `Server error (${res.status}) — please try again`);
  }

  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.error ?? `Request failed (${res.status})`);
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
  search: async (filters: Partial<PropertyFilters> & { page?: number; limit?: number }): Promise<PaginatedResponse<Property>> => {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/api/properties${buildQuery(filters)}`, {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      });
    } catch (err) {
      console.error('[API] properties.search network error:', (err as Error).message);
      throw new ApiError(0, 'Cannot reach the server — check your connection');
    }

    let json: PaginatedResponse<Property>;
    try {
      json = await res.json() as PaginatedResponse<Property>;
    } catch {
      console.error(`[API] properties.search non-JSON response — status ${res.status}`);
      throw new ApiError(res.status, `Server error (${res.status}) — please try again`);
    }

    if (!res.ok) throw new ApiError(res.status, (json as unknown as ApiResponse<Property>).error ?? `Search failed (${res.status})`);
    return json;
  },

  getById: (id: string) => request<Property>(`/api/properties/${id}`),

  getAnalysis: (id: string) =>
    request<InvestmentAnalysis>(`/api/properties/${id}/analysis`),

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

  resolveMapsUrl: (url: string) =>
    request<{ lat: number; lng: number }>('/api/properties/resolve-maps-url', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  compare: (ids: string[]) =>
    request<{ properties: Property[]; ai_comparison: CompareResult }>('/api/properties/compare', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
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

// ── Manager (admin user management) ──────────────────────────────────────────

export const manager = {
  listAdmins: () => request<AdminUser[]>('/api/manager/admins'),

  createAdmin: (email: string, name?: string) =>
    request<AdminUser>('/api/manager/admins', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    }),

  deactivateAdmin: (id: string) =>
    request<{ message: string }>(`/api/manager/admins/${id}`, { method: 'DELETE' }),

  reactivateAdmin: (id: string) =>
    request<{ message: string }>(`/api/manager/admins/${id}/reactivate`, { method: 'PATCH' }),

  listClients: (search?: string) =>
    request<AdminUser[]>(`/api/manager/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
};

export { ApiError };
