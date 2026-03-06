import { query, queryOne } from '../../config/db';
import { AppError } from '../../utils/response';
import { v4 as uuidv4 } from 'uuid';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  last_login: Date | null;
}

/** List all admin users */
export async function listAdmins(): Promise<AdminUser[]> {
  return query<AdminUser>(
    `SELECT id, email, name, role, is_active, created_at, last_login
     FROM users WHERE role = 'admin' ORDER BY created_at DESC`,
  );
}

/** Create a new admin user by email */
export async function createAdmin(email: string, name?: string): Promise<AdminUser> {
  const existing = await queryOne<{ id: string; role: string }>(
    `SELECT id, role FROM users WHERE email = $1`,
    [email],
  );

  if (existing) {
    if (existing.role === 'admin') {
      throw new AppError('User is already an admin', 409);
    }
    // Promote existing user to admin
    const updated = await queryOne<AdminUser>(
      `UPDATE users SET role = 'admin', is_active = true
       WHERE id = $1
       RETURNING id, email, name, role, is_active, created_at, last_login`,
      [existing.id],
    );
    if (!updated) throw new AppError('Failed to promote user', 500);
    return updated;
  }

  // Create new user account with admin role
  const displayName = name ?? email.split('@')[0] ?? 'Admin';
  const admin = await queryOne<AdminUser>(
    `INSERT INTO users (id, email, name, role, preferences)
     VALUES ($1, $2, $3, 'admin', '{}')
     RETURNING id, email, name, role, is_active, created_at, last_login`,
    [uuidv4(), email, displayName],
  );
  if (!admin) throw new AppError('Failed to create admin', 500);
  return admin;
}

/** Deactivate (soft-delete) an admin */
export async function deactivateAdmin(adminId: string): Promise<void> {
  const result = await queryOne<{ id: string }>(
    `UPDATE users SET is_active = false WHERE id = $1 AND role = 'admin'
     RETURNING id`,
    [adminId],
  );
  if (!result) throw new AppError('Admin not found', 404);
}

/** Reactivate a previously deactivated admin */
export async function reactivateAdmin(adminId: string): Promise<void> {
  const result = await queryOne<{ id: string }>(
    `UPDATE users SET is_active = true WHERE id = $1 AND role = 'admin'
     RETURNING id`,
    [adminId],
  );
  if (!result) throw new AppError('Admin not found', 404);
}

/** List all clients with optional search */
export async function listClients(search?: string): Promise<AdminUser[]> {
  return query<AdminUser>(
    `SELECT id, email, name, role, is_active, created_at, last_login
     FROM users
     WHERE role = 'client'
       AND ($1::text IS NULL OR email ILIKE '%' || $1 || '%' OR name ILIKE '%' || $1 || '%')
     ORDER BY created_at DESC
     LIMIT 100`,
    [search ?? null],
  );
}
