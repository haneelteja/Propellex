import type { Request, Response } from 'express';
import {
  searchProperties,
  getPropertyById,
  getComparables,
  getInvestmentAnalysis,
  createProperty,
  updateProperty,
  deleteProperty,
  analyzePropertyWithAI,
  type PropertyInput,
} from './property.service';
import { ok, paginated } from '../../utils/response';
import { queryOne } from '../../config/db';

export async function handleSearch(req: Request, res: Response): Promise<void> {
  const q = req.query as Record<string, string>;
  const result = await searchProperties({
    search: q.query || q.search,
    locality: q.locality,
    city: q.city,
    min_price: q.min_price ? Number(q.min_price) : undefined,
    max_price: q.max_price ? Number(q.max_price) : undefined,
    min_area: q.min_area ? Number(q.min_area) : undefined,
    max_area: q.max_area ? Number(q.max_area) : undefined,
    bedrooms: q.bedrooms ? Number(q.bedrooms) : undefined,
    property_type: q.property_type,
    status: q.status,
    rera_status: q.rera_status,
    sort: q.sort as PropertyFilter['sort'],
    page: q.page ? Number(q.page) : 1,
    limit: q.limit ? Number(q.limit) : 20,
  });
  paginated(res, result.data, result.pagination);
}

export async function handleGetOne(req: Request, res: Response): Promise<void> {
  const property = await getPropertyById(req.params.id!);
  ok(res, property);
}

export async function handleComparables(req: Request, res: Response): Promise<void> {
  const comparables = await getComparables(req.params.id!);
  ok(res, comparables);
}

export async function handleAnalysis(req: Request, res: Response): Promise<void> {
  const analysis = await getInvestmentAnalysis(req.params.id!);
  ok(res, analysis);
}

async function getAgencyForUser(userId: string): Promise<{ id: string } | null> {
  return queryOne<{ id: string }>(
    `SELECT id FROM agencies WHERE id = (SELECT agency_id FROM users WHERE id = $1)`,
    [userId],
  );
}

export async function handleCreate(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
  // Admin/manager can pass agency_id in body or use their linked agency
  const agencyRow = await getAgencyForUser(req.user.userId);
  const body = req.body as PropertyInput & { agency_id?: string };
  const agencyId = agencyRow?.id ?? body.agency_id ?? null;
  const property = await createProperty(agencyId, body, req.user.userId);
  ok(res, property, 201);
}

export async function handleUpdate(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
  const agencyRow = await getAgencyForUser(req.user.userId);
  const agencyId = agencyRow?.id ?? null;
  // Manager can edit any property; admin restricted to their agency's properties
  const property = await updateProperty(req.params.id!, agencyId, req.user.role ?? 'client', req.body as Partial<PropertyInput>);
  ok(res, property);
}

export async function handleDelete(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
  const agencyRow = await getAgencyForUser(req.user.userId);
  const agencyId = agencyRow?.id ?? null;
  await deleteProperty(req.params.id!, agencyId, req.user.role ?? 'client');
  ok(res, { message: 'Property deleted' });
}

export async function handleAiAnalyze(req: Request, res: Response): Promise<void> {
  await analyzePropertyWithAI(req.params.id!);
  ok(res, { message: 'AI analysis complete' });
}

/** Resolve a Google Maps URL (including short maps.app.goo.gl links) server-side
 *  and return the extracted lat/lng coordinates. */
export async function handleResolveMapsUrl(req: Request, res: Response): Promise<void> {
  const { url } = req.body as { url?: string };
  if (!url) { res.status(400).json({ success: false, error: 'url is required' }); return; }

  // Follow all redirects server-side (no CORS restrictions here)
  let finalUrl: string;
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Propellex/1.0)' },
    });
    finalUrl = response.url;
  } catch {
    res.status(400).json({ success: false, error: 'Could not resolve the URL' });
    return;
  }

  // Try all known Google Maps coordinate formats
  const atMatch = finalUrl.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/);
  if (atMatch) { ok(res, { lat: parseFloat(atMatch[1]!), lng: parseFloat(atMatch[2]!) }); return; }

  const qMatch = finalUrl.match(/[?&]q=(-?\d+\.?\d+),(-?\d+\.?\d+)/);
  if (qMatch) { ok(res, { lat: parseFloat(qMatch[1]!), lng: parseFloat(qMatch[2]!) }); return; }

  const llMatch = finalUrl.match(/[?&]ll=(-?\d+\.?\d+),(-?\d+\.?\d+)/);
  if (llMatch) { ok(res, { lat: parseFloat(llMatch[1]!), lng: parseFloat(llMatch[2]!) }); return; }

  res.status(400).json({ success: false, error: 'Could not extract coordinates from the URL' });
}

// Re-export for type usage
import type { PropertyFilter } from './property.service';
export type { PropertyFilter };
