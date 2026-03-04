import { query, queryOne } from '../../config/db';
import { AppError } from '../../utils/response';
import { serializeMoney } from '../../utils/currency';

export interface PropertyFilter {
  search?: string;
  locality?: string;
  city?: string;
  min_price?: number;   // rupees
  max_price?: number;   // rupees
  min_area?: number;
  max_area?: number;
  bedrooms?: number;
  property_type?: string;
  status?: string;
  rera_status?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'relevance';
  page?: number;
  limit?: number;
}

const SORT_MAP: Record<string, string> = {
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
  newest: 'p.published_at DESC NULLS LAST, p.created_at DESC',
  relevance: 'p.created_at DESC',
};

export async function searchProperties(filters: PropertyFilter) {
  const {
    search, locality, city = 'Hyderabad',
    min_price, max_price,
    min_area, max_area,
    bedrooms, property_type, status, rera_status,
    sort = 'newest',
    page = 1, limit = 20,
  } = filters;

  const offset = (page - 1) * Math.min(limit, 50);
  const pageLimit = Math.min(limit, 50);
  const params: unknown[] = [];
  const conditions: string[] = ['p.is_active = true'];

  if (city) {
    params.push(city);
    conditions.push(`p.city = $${params.length}`);
  }
  if (locality) {
    params.push(locality);
    conditions.push(`p.locality ILIKE $${params.length}`);
  }
  if (min_price != null) {
    params.push(min_price * 100); // to paise
    conditions.push(`p.price >= $${params.length}`);
  }
  if (max_price != null) {
    params.push(max_price * 100);
    conditions.push(`p.price <= $${params.length}`);
  }
  if (min_area != null) {
    params.push(min_area);
    conditions.push(`p.area_sqft >= $${params.length}`);
  }
  if (max_area != null) {
    params.push(max_area);
    conditions.push(`p.area_sqft <= $${params.length}`);
  }
  if (bedrooms != null) {
    params.push(bedrooms);
    conditions.push(`p.bedrooms = $${params.length}`);
  }
  if (property_type) {
    params.push(property_type);
    conditions.push(`p.property_type = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`p.status = $${params.length}`);
  }
  if (rera_status) {
    params.push(rera_status);
    conditions.push(`p.rera_status = $${params.length}`);
  }

  let searchRank = '';
  if (search) {
    params.push(search);
    conditions.push(
      `p.search_vector @@ plainto_tsquery('english', $${params.length})`,
    );
    searchRank = `, ts_rank(p.search_vector, plainto_tsquery('english', $${params.length})) AS rank`;
  }

  const where = conditions.join(' AND ');
  const orderBy = sort === 'relevance' && search ? 'rank DESC' : (SORT_MAP[sort] ?? SORT_MAP.newest);

  params.push(pageLimit, offset);
  const dataQuery = `
    SELECT p.id, p.title, p.property_type, p.status, p.price, p.price_per_sqft,
           p.area_sqft, p.bedrooms, p.bathrooms, p.locality, p.city, p.lat, p.lng,
           p.amenities, p.builder_name, p.rera_number, p.rera_status,
           p.photos, p.risk_score, p.roi_estimate_3yr, p.published_at${searchRank}
    FROM properties p
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const countParams = params.slice(0, params.length - 2);
  const countQuery = `SELECT COUNT(*) AS total FROM properties p WHERE ${where}`;

  const [rows, countRows] = await Promise.all([
    query(dataQuery, params),
    query<{ total: string }>(countQuery, countParams),
  ]);

  const total = parseInt(countRows[0]?.total ?? '0', 10);
  return {
    data: rows.map(serializeMoney),
    pagination: {
      page,
      limit: pageLimit,
      total,
      pages: Math.ceil(total / pageLimit),
    },
  };
}

export async function getPropertyById(id: string) {
  const row = await queryOne(
    `SELECT p.*, a.agency_name, a.contact_name AS agency_contact, a.phone AS agency_phone
     FROM properties p
     LEFT JOIN agencies a ON a.id = p.agency_id
     WHERE p.id = $1 AND p.is_active = true`,
    [id],
  );
  if (!row) throw new AppError('Property not found', 404);
  return serializeMoney(row as Record<string, unknown>);
}

export async function getComparables(id: string) {
  const prop = await queryOne<{ locality: string; price: bigint; property_type: string }>(
    'SELECT locality, price, property_type FROM properties WHERE id = $1',
    [id],
  );
  if (!prop) throw new AppError('Property not found', 404);

  const rows = await query(
    `SELECT id, title, property_type, price, price_per_sqft, area_sqft,
            bedrooms, locality, rera_status, photos, risk_score, roi_estimate_3yr
     FROM properties
     WHERE id != $1
       AND locality = $2
       AND property_type = $3
       AND price BETWEEN $4 * 0.7 AND $4 * 1.3
       AND is_active = true
     ORDER BY ABS(price - $4)
     LIMIT 5`,
    [id, prop.locality, prop.property_type, prop.price],
  );
  return rows.map(serializeMoney);
}

export async function getInvestmentAnalysis(id: string) {
  const prop = await queryOne<{
    price: bigint;
    area_sqft: number;
    locality: string;
    risk_score: number;
    roi_estimate_3yr: number;
    rera_status: string;
    price_forecast_json: unknown;
  }>(
    `SELECT price, area_sqft, locality, risk_score, roi_estimate_3yr,
            rera_status, price_forecast_json FROM properties WHERE id = $1`,
    [id],
  );
  if (!prop) throw new AppError('Property not found', 404);

  const priceRupees = Number(prop.price) / 100;
  const roiYr3 = prop.roi_estimate_3yr ?? 12;

  return {
    current_price: priceRupees,
    price_per_sqft: Math.round(priceRupees / prop.area_sqft),
    risk_score: prop.risk_score,
    risk_label: prop.risk_score < 33 ? 'Low' : prop.risk_score < 66 ? 'Medium' : 'High',
    roi_estimate_3yr: roiYr3,
    estimated_value_3yr: Math.round(priceRupees * (1 + roiYr3 / 100) ** 3),
    rental_yield_estimate: 3.5,  // % — static in V1
    price_forecast: prop.price_forecast_json,
    risk_factors: {
      rera_compliance: prop.rera_status === 'verified' ? 100 : prop.rera_status === 'pending' ? 50 : 0,
      locality_demand: 72,  // static V1
      price_stability: 65,
    },
  };
}
