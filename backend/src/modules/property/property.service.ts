import { query, queryOne } from '../../config/db';
import { AppError } from '../../utils/response';
import { serializeMoney } from '../../utils/currency';
import { v4 as uuidv4 } from 'uuid';

export interface PropertyInput {
  title: string;
  description?: string;
  property_type: 'residential' | 'commercial' | 'plot';
  status: 'ready_to_move' | 'under_construction';
  price_cr: number;           // crores — converted to paise
  area_sqft: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  locality: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  amenities?: string[];
  builder_name?: string;
  rera_number?: string;
  photos?: string[];
}

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
  published_desc: 'p.published_at DESC NULLS LAST, p.created_at DESC',
  area_desc: 'p.area_sqft DESC',
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
      total_pages: Math.ceil(total / pageLimit),
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

export async function createProperty(agencyId: string | null, input: PropertyInput, uploadedBy?: string) {
  const pricePaise = Math.round(input.price_cr * 1_00_00_000 * 100); // cr → rupees → paise
  const pricePerSqft = Math.round(pricePaise / input.area_sqft);
  const id = uuidv4();
  const row = await queryOne(
    `INSERT INTO properties (
       id, title, description, property_type, status,
       price, price_per_sqft, area_sqft, bedrooms, bathrooms,
       locality, city, pincode, lat, lng,
       amenities, builder_name, rera_number, rera_status,
       photos, agency_id, uploaded_by, is_active, published_at
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Hyderabad',$12,$13,$14,$15,$16,$17,'pending',$18,$19,$20,true,NOW()
     ) RETURNING *`,
    [
      id,
      input.title,
      input.description ?? '',
      input.property_type,
      input.status,
      pricePaise,
      pricePerSqft,
      input.area_sqft,
      input.bedrooms ?? null,
      input.bathrooms ?? null,
      input.locality,
      input.pincode ?? null,
      input.lat ?? null,
      input.lng ?? null,
      JSON.stringify(input.amenities ?? []),
      input.builder_name ?? null,
      input.rera_number ?? null,
      JSON.stringify(input.photos ?? []),
      agencyId,
      uploadedBy ?? null,
    ],
  );
  if (!row) throw new AppError('Failed to create property', 500);
  return serializeMoney(row as Record<string, unknown>);
}

export async function updateProperty(
  propertyId: string,
  agencyId: string | null,
  role: string,
  input: Partial<PropertyInput>,
) {
  const existing = await queryOne<{ agency_id: string }>(
    'SELECT agency_id FROM properties WHERE id = $1 AND is_active = true',
    [propertyId],
  );
  if (!existing) throw new AppError('Property not found', 404);
  // Manager and admin can edit any property; only pure client accounts are blocked
  if (role !== 'manager' && role !== 'admin' && existing.agency_id !== agencyId) {
    throw new AppError('Not authorized to edit this property', 403);
  }

  const pricePaise = input.price_cr != null ? Math.round(input.price_cr * 1_00_00_000 * 100) : null;
  const row = await queryOne(
    `UPDATE properties SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       property_type = COALESCE($3, property_type),
       status = COALESCE($4, status),
       price = COALESCE($5, price),
       area_sqft = COALESCE($6, area_sqft),
       bedrooms = COALESCE($7, bedrooms),
       bathrooms = COALESCE($8, bathrooms),
       locality = COALESCE($9, locality),
       amenities = COALESCE($10::jsonb, amenities),
       builder_name = COALESCE($11, builder_name),
       photos = COALESCE($12::jsonb, photos)
     WHERE id = $13
     RETURNING *`,
    [
      input.title ?? null,
      input.description ?? null,
      input.property_type ?? null,
      input.status ?? null,
      pricePaise,
      input.area_sqft ?? null,
      input.bedrooms ?? null,
      input.bathrooms ?? null,
      input.locality ?? null,
      input.amenities ? JSON.stringify(input.amenities) : null,
      input.builder_name ?? null,
      input.photos ? JSON.stringify(input.photos) : null,
      propertyId,
    ],
  );
  return serializeMoney(row as Record<string, unknown>);
}

export async function deleteProperty(propertyId: string, agencyId: string | null, role: string) {
  const existing = await queryOne<{ agency_id: string }>(
    'SELECT agency_id FROM properties WHERE id = $1',
    [propertyId],
  );
  if (!existing) throw new AppError('Property not found', 404);
  // Manager and admin can delete any property
  if (role !== 'manager' && role !== 'admin' && existing.agency_id !== agencyId) {
    throw new AppError('Not authorized to delete this property', 403);
  }
  await query('UPDATE properties SET is_active = false WHERE id = $1', [propertyId]);
}

export interface CompareResult {
  ratings: Array<{ id: string; overall_score: number; strengths: string[]; weaknesses: string[] }>;
  best_pick_id: string;
  best_pick_reason: string;
  summary: string;
}

/** Compare up to 4 properties using the AI service and return holistic analysis. */
export async function comparePropertiesWithAI(ids: string[]): Promise<{
  properties: ReturnType<typeof serializeMoney>[];
  ai_comparison: CompareResult;
}> {
  if (ids.length < 2 || ids.length > 4) {
    throw new AppError('Provide 2–4 property IDs to compare', 400);
  }

  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  const rows = await query<{
    id: string; title: string; property_type: string; status: string;
    price: string; price_per_sqft: string; area_sqft: number;
    bedrooms: number | null; bathrooms: number | null;
    locality: string; city: string; amenities: string[];
    builder_name: string | null; rera_status: string;
    roi_estimate_3yr: string; risk_score: number;
    lat: number | null; lng: number | null; description: string;
    ai_analysis: unknown; ai_analyzed_at: string | null;
    pincode: string; photos: string[]; rera_number: string;
    is_active: boolean; published_at: string; agency_id: string;
  }>(
    `SELECT id, title, property_type, status, price, price_per_sqft, area_sqft,
            bedrooms, bathrooms, locality, city, pincode, amenities, builder_name,
            rera_number, rera_status, photos, risk_score, roi_estimate_3yr,
            lat, lng, description, is_active, published_at, agency_id,
            ai_analysis, ai_analyzed_at
     FROM properties WHERE id IN (${placeholders}) AND is_active = true`,
    ids,
  );

  if (rows.length < 2) throw new AppError('At least 2 valid properties required for comparison', 400);

  const aiServiceUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:8001';
  const aiPayload = rows.map((p) => ({
    id: p.id,
    title: p.title,
    property_type: p.property_type,
    status: p.status,
    price: Number(p.price) / 100,
    price_per_sqft: Number(p.price_per_sqft) / 100,
    area_sqft: p.area_sqft,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    locality: p.locality,
    city: p.city,
    amenities: p.amenities ?? [],
    builder_name: p.builder_name,
    rera_status: p.rera_status,
    roi_estimate_3yr: parseFloat(p.roi_estimate_3yr) || 0,
    risk_score: p.risk_score,
    lat: p.lat,
    lng: p.lng,
    description: p.description ?? '',
  }));

  const aiResponse = await fetch(`${aiServiceUrl}/analyze/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties: aiPayload }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    const isHtml = errText.trimStart().startsWith('<');
    throw new AppError(`AI service error: ${isHtml ? `HTTP ${aiResponse.status} (service unavailable)` : errText.slice(0, 200)}`, 502);
  }

  const ai_comparison = await aiResponse.json() as CompareResult;
  return {
    properties: rows.map((r) => serializeMoney(r as Record<string, unknown>)),
    ai_comparison,
  };
}

/** Returns IDs of properties that haven't been AI-analyzed yet,
 *  or whose analysis is older than 23 hours (stale). */
export async function getPropertiesNeedingAnalysis(): Promise<string[]> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM properties
     WHERE is_active = true
       AND (
         (analysis_priority = 'high'   AND (ai_analyzed_at IS NULL OR ai_analyzed_at < NOW() - INTERVAL '6 hours'))
      OR (analysis_priority = 'medium' AND (ai_analyzed_at IS NULL OR ai_analyzed_at < NOW() - INTERVAL '1 day'))
      OR (analysis_priority = 'low'    AND (ai_analyzed_at IS NULL OR ai_analyzed_at < NOW() - INTERVAL '4 days'))
      OR (analysis_priority IS NULL    AND (ai_analyzed_at IS NULL OR ai_analyzed_at < NOW() - INTERVAL '1 day'))
       )
     ORDER BY
       CASE analysis_priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
       ai_analyzed_at ASC NULLS FIRST`,
  );
  return rows.map((r) => r.id);
}

export async function analyzePropertyWithAI(id: string): Promise<void> {
  const prop = await queryOne<{
    id: string; title: string; property_type: string; status: string;
    price: string; price_per_sqft: string; area_sqft: number;
    bedrooms: number | null; bathrooms: number | null;
    locality: string; city: string; amenities: string[];
    builder_name: string | null; rera_status: string;
    roi_estimate_3yr: string; risk_score: number;
    lat: number | null; lng: number | null; description: string;
  }>(
    `SELECT id, title, property_type, status, price, price_per_sqft, area_sqft,
            bedrooms, bathrooms, locality, city, amenities, builder_name,
            rera_status, roi_estimate_3yr, risk_score, lat, lng, description
     FROM properties WHERE id = $1 AND is_active = true`,
    [id],
  );
  if (!prop) throw new AppError('Property not found', 404);

  const aiServiceUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:8001';
  const response = await fetch(`${aiServiceUrl}/analyze/property`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: prop.id,
      title: prop.title,
      property_type: prop.property_type,
      status: prop.status,
      price: Number(prop.price) / 100,               // paise → rupees
      price_per_sqft: Number(prop.price_per_sqft) / 100,
      area_sqft: prop.area_sqft,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      locality: prop.locality,
      city: prop.city,
      amenities: prop.amenities ?? [],
      builder_name: prop.builder_name,
      rera_status: prop.rera_status,
      roi_estimate_3yr: parseFloat(prop.roi_estimate_3yr) || 0,
      risk_score: prop.risk_score,
      lat: prop.lat,
      lng: prop.lng,
      description: prop.description ?? '',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const isHtml = errorText.trimStart().startsWith('<');
    let errMsg: string;
    if (isHtml) {
      errMsg = `HTTP ${response.status} (service unavailable)`;
    } else {
      // FastAPI returns { "detail": "..." } — extract that so the cron can pattern-match cleanly
      try { errMsg = (JSON.parse(errorText) as { detail?: string }).detail ?? errorText.slice(0, 200); }
      catch { errMsg = errorText.slice(0, 200); }
    }
    throw new AppError(`AI service error: ${errMsg}`, response.status === 429 ? 429 : 502);
  }

  const analysis = await response.json() as Record<string, unknown>;
  const aiPriority = analysis.analysis_priority;
  const validPriority = (aiPriority === 'high' || aiPriority === 'medium' || aiPriority === 'low')
    ? aiPriority : null;

  await query(
    `UPDATE properties
     SET ai_analysis = $1,
         ai_analyzed_at = NOW(),
         analysis_priority = COALESCE($3, analysis_priority)
     WHERE id = $2`,
    [JSON.stringify(analysis), id, validPriority],
  );
}
