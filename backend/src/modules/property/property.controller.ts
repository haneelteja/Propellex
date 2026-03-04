import type { Request, Response } from 'express';
import {
  searchProperties,
  getPropertyById,
  getComparables,
  getInvestmentAnalysis,
} from './property.service';
import { ok, paginated } from '../../utils/response';

export async function handleSearch(req: Request, res: Response): Promise<void> {
  const q = req.query as Record<string, string>;
  const result = await searchProperties({
    search: q.search,
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

// Re-export for type usage
import type { PropertyFilter } from './property.service';
export type { PropertyFilter };
