import { query, queryOne } from '../../config/db';
import { AppError } from '../../utils/response';
import { serializeMoney } from '../../utils/currency';
import { v4 as uuidv4 } from 'uuid';

const FREE_SAVE_LIMIT = 3;

export async function getPortfolio(userId: string) {
  const rows = await query<{
    id: string; property_id: string; intent: string; added_at: string;
    notes: string; status: string; custom_roi_inputs: unknown;
    prop_id: string; title: string; property_type: string; prop_status: string;
    price: string; price_per_sqft: string; area_sqft: number;
    bedrooms: number | null; bathrooms: number | null;
    locality: string; city: string; lat: number; lng: number;
    pincode: string; amenities: string[]; builder_name: string | null;
    rera_number: string; rera_status: string; photos: string[];
    risk_score: number; roi_estimate_3yr: string;
    is_active: boolean; published_at: string; agency_id: string;
    ai_analysis: unknown; ai_analyzed_at: string | null; description: string;
  }>(
    `SELECT po.id, po.property_id, po.intent, po.added_at, po.notes, po.status, po.custom_roi_inputs,
            p.id            AS prop_id,
            p.title, p.property_type,
            p.status        AS prop_status,
            p.price, p.price_per_sqft,
            p.area_sqft, p.bedrooms, p.bathrooms,
            p.locality, p.city, p.lat, p.lng, p.pincode,
            p.amenities, p.builder_name, p.rera_number, p.rera_status,
            p.photos, p.risk_score, p.roi_estimate_3yr,
            p.is_active, p.published_at, p.agency_id,
            p.ai_analysis, p.ai_analyzed_at, p.description
     FROM portfolio po
     JOIN properties p ON p.id = po.property_id
     WHERE po.user_id = $1
     ORDER BY po.added_at DESC`,
    [userId],
  );

  return rows.map((row) => {
    const property = serializeMoney({
      id: row.prop_id,
      title: row.title,
      property_type: row.property_type,
      status: row.prop_status,
      price: row.price,
      price_per_sqft: row.price_per_sqft,
      area_sqft: row.area_sqft,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      locality: row.locality,
      city: row.city,
      lat: row.lat,
      lng: row.lng,
      pincode: row.pincode,
      amenities: row.amenities ?? [],
      builder_name: row.builder_name,
      rera_number: row.rera_number,
      rera_status: row.rera_status,
      photos: row.photos ?? [],
      risk_score: row.risk_score,
      roi_estimate_3yr: row.roi_estimate_3yr,
      is_active: row.is_active,
      published_at: row.published_at,
      agency_id: row.agency_id,
      ai_analysis: row.ai_analysis ?? null,
      ai_analyzed_at: row.ai_analyzed_at,
      description: row.description,
    });
    return {
      id: row.id,
      property_id: row.property_id,
      intent: row.intent,
      added_at: row.added_at,
      notes: row.notes,
      status: row.status,
      custom_roi_inputs: row.custom_roi_inputs,
      property,
    };
  });
}

export async function addToPortfolio(
  userId: string,
  propertyId: string,
  subscriptionTier: string,
  intent: 'buy' | 'invest' | 'watch' = 'watch',
) {
  if (subscriptionTier === 'free') {
    const count = await queryOne<{ count: string }>(
      'SELECT COUNT(*) AS count FROM portfolio WHERE user_id = $1',
      [userId],
    );
    if (parseInt(count?.count ?? '0', 10) >= FREE_SAVE_LIMIT) {
      throw new AppError(
        `Free tier allows max ${FREE_SAVE_LIMIT} saved properties. Upgrade to Premium.`,
        429,
      );
    }
  }

  const existing = await queryOne(
    'SELECT id FROM portfolio WHERE user_id = $1 AND property_id = $2',
    [userId, propertyId],
  );
  if (existing) throw new AppError('Property already in shortlist', 409);

  const row = await queryOne(
    `INSERT INTO portfolio (id, user_id, property_id, intent)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [uuidv4(), userId, propertyId, intent],
  );
  return row;
}

export async function updatePortfolioItem(
  userId: string,
  itemId: string,
  data: { status?: string; notes?: string; custom_roi_inputs?: Record<string, unknown> },
) {
  const row = await queryOne(
    `UPDATE portfolio
     SET status = COALESCE($1, status),
         notes = COALESCE($2, notes),
         custom_roi_inputs = CASE WHEN $3::jsonb IS NOT NULL THEN $3::jsonb ELSE custom_roi_inputs END
     WHERE id = $4 AND user_id = $5
     RETURNING *`,
    [
      data.status ?? null,
      data.notes ?? null,
      data.custom_roi_inputs ? JSON.stringify(data.custom_roi_inputs) : null,
      itemId,
      userId,
    ],
  );
  if (!row) throw new AppError('Portfolio item not found', 404);
  return row;
}

export async function removeFromPortfolio(userId: string, itemId: string) {
  const result = await query(
    'DELETE FROM portfolio WHERE id = $1 AND user_id = $2 RETURNING id',
    [itemId, userId],
  );
  if (!result.length) throw new AppError('Portfolio item not found', 404);
}
