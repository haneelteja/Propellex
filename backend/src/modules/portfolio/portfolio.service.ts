import { query, queryOne } from '../../config/db';
import { AppError } from '../../utils/response';
import { serializeMoney } from '../../utils/currency';
import { v4 as uuidv4 } from 'uuid';

const FREE_SAVE_LIMIT = 3;

export async function getPortfolio(userId: string) {
  const rows = await query(
    `SELECT po.id, po.property_id, po.intent, po.added_at, po.notes, po.status, po.custom_roi_inputs,
            p.title, p.property_type, p.price, p.area_sqft, p.bedrooms,
            p.locality, p.rera_status, p.photos, p.risk_score, p.roi_estimate_3yr
     FROM portfolio po
     JOIN properties p ON p.id = po.property_id
     WHERE po.user_id = $1
     ORDER BY po.added_at DESC`,
    [userId],
  );
  return rows.map(serializeMoney);
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
