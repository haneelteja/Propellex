import { query } from '../../config/db';
import { queryOne } from '../../config/db';
import { serializeMoney } from '../../utils/currency';

interface UserPrefs {
  budget_min?: number;
  budget_max?: number;
  localities?: string[];
  property_types?: string[];
  roi_target?: number;
  risk_appetite?: 'low' | 'medium' | 'high';
}

interface ScoredProperty {
  id: string;
  match_score: number;
  why_recommended: string;
  [key: string]: unknown;
}

const RISK_MAP: Record<string, [number, number]> = {
  low: [0, 33],
  medium: [33, 66],
  high: [66, 100],
};

function scoreProperty(
  prop: Record<string, unknown>,
  prefs: UserPrefs,
): { score: number; reason: string } {
  const scores: Record<string, number> = {
    locality: 0,
    budget: 0,
    property_type: 0,
    roi: 0,
    risk: 0,
  };

  // Locality match (30%)
  if (prefs.localities?.length) {
    const match = prefs.localities.some(
      (l) => (prop.locality as string)?.toLowerCase().includes(l.toLowerCase()),
    );
    scores.locality = match ? 100 : 0;
  } else {
    scores.locality = 70; // neutral
  }

  // Budget fit (25%)
  const priceRupees = (prop.price as number) ?? 0;
  if (prefs.budget_min != null && prefs.budget_max != null) {
    const range = prefs.budget_max - prefs.budget_min;
    const midpoint = (prefs.budget_min + prefs.budget_max) / 2;
    const deviation = Math.abs(priceRupees - midpoint) / (range / 2);
    scores.budget = Math.max(0, 100 - deviation * 100);
  } else {
    scores.budget = 70;
  }

  // Property type match (20%)
  if (prefs.property_types?.length) {
    scores.property_type = prefs.property_types.includes(prop.property_type as string) ? 100 : 0;
  } else {
    scores.property_type = 70;
  }

  // ROI proximity (15%)
  if (prefs.roi_target != null && prop.roi_estimate_3yr != null) {
    const diff = Math.abs((prop.roi_estimate_3yr as number) - prefs.roi_target);
    scores.roi = Math.max(0, 100 - diff * 10);
  } else {
    scores.roi = 70;
  }

  // Risk appetite match (10%)
  if (prefs.risk_appetite) {
    const [min, max] = RISK_MAP[prefs.risk_appetite];
    const riskScore = prop.risk_score as number ?? 50;
    scores.risk = riskScore >= min && riskScore <= max ? 100 : 30;
  } else {
    scores.risk = 70;
  }

  const weights = { locality: 0.30, budget: 0.25, property_type: 0.20, roi: 0.15, risk: 0.10 };
  const total = Object.entries(scores).reduce(
    (sum, [key, val]) => sum + val * weights[key as keyof typeof weights],
    0,
  );

  // Top reason = highest contributing factor
  const topFactor = Object.entries(scores).sort(([, a], [, b]) => b - a)[0]![0];
  const reasonMap: Record<string, string> = {
    locality: 'Matches your preferred localities',
    budget: 'Within your budget range',
    property_type: 'Matches your property type preference',
    roi: 'Close to your ROI target',
    risk: 'Matches your risk appetite',
  };

  return { score: Math.round(total), reason: reasonMap[topFactor] ?? 'Good overall match' };
}

export async function getRecommendations(userId: string, limit = 20) {
  const user = await queryOne<{ preferences: UserPrefs }>(
    'SELECT preferences FROM users WHERE id = $1',
    [userId],
  );
  const prefs: UserPrefs = user?.preferences ?? {};

  const properties = await query(
    `SELECT id, title, property_type, status, price, price_per_sqft, area_sqft,
            bedrooms, bathrooms, locality, city, lat, lng, amenities,
            builder_name, rera_number, rera_status, photos, risk_score, roi_estimate_3yr
     FROM properties
     WHERE is_active = true
     ORDER BY published_at DESC NULLS LAST
     LIMIT 200`,
  );

  const scored: ScoredProperty[] = properties
    .map((p) => {
      const { score, reason } = scoreProperty(p as Record<string, unknown>, prefs);
      return { ...serializeMoney(p as Record<string, unknown>), match_score: score, why_recommended: reason };
    })
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);

  return scored;
}

export async function saveFeedback(
  userId: string,
  propertyId: string,
  feedback: 'up' | 'down',
) {
  await query(
    `INSERT INTO recommendation_feedback (user_id, property_id, feedback)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, property_id) DO UPDATE SET feedback = $3`,
    [userId, propertyId, feedback],
  );
}
