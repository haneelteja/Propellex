import type { Request, Response } from 'express';
import { ok, fail } from '../../utils/response';
import { listAdmins, createAdmin, deactivateAdmin, reactivateAdmin, listClients, setPropertyPriority } from './manager.service';

export async function handleListAdmins(_req: Request, res: Response): Promise<void> {
  const admins = await listAdmins();
  ok(res, admins);
}

export async function handleCreateAdmin(req: Request, res: Response): Promise<void> {
  const { email, name } = req.body as { email?: string; name?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail(res, 'Valid email required');
    return;
  }
  const admin = await createAdmin(email.toLowerCase().trim(), name?.trim());
  ok(res, admin, 201);
}

export async function handleDeactivateAdmin(req: Request, res: Response): Promise<void> {
  await deactivateAdmin(req.params.id!);
  ok(res, { message: 'Admin deactivated' });
}

export async function handleReactivateAdmin(req: Request, res: Response): Promise<void> {
  await reactivateAdmin(req.params.id!);
  ok(res, { message: 'Admin reactivated' });
}

export async function handleListClients(req: Request, res: Response): Promise<void> {
  const { search } = req.query as { search?: string };
  const clients = await listClients(search);
  ok(res, clients);
}

export async function handleSetPropertyPriority(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { priority } = req.body as { priority?: string };
  if (!priority || !['high', 'medium', 'low'].includes(priority)) {
    fail(res, 'priority must be one of: high, medium, low');
    return;
  }
  const result = await setPropertyPriority(id, priority as 'high' | 'medium' | 'low');
  ok(res, result);
}
