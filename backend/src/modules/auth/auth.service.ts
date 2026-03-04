import { query, queryOne } from '../../config/db';
import { redis } from '../../config/redis';
import { signToken } from '../../middleware/auth';
import { AppError } from '../../utils/response';
import { v4 as uuidv4 } from 'uuid';

export interface UserPreferences {
  budget_min?: number;   // paise
  budget_max?: number;   // paise
  localities?: string[];
  property_types?: string[];
  roi_target?: number;   // percent
  risk_appetite?: 'low' | 'medium' | 'high';
  holding_period_years?: number;
}

interface User {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  user_type: string;
  subscription_tier: 'free' | 'premium';
  preferences: UserPreferences;
  interaction_count: number;
  created_at: Date;
}

const OTP_TTL_SECONDS = 600; // 10 minutes

// In-memory fallback when Redis is unavailable (single-instance safe)
const otpMemory = new Map<string, { code: string; expiresAt: number }>();

async function setOTP(email: string, code: string): Promise<void> {
  try {
    await redis.set(`otp:${email}`, code, 'EX', OTP_TTL_SECONDS);
  } catch {
    otpMemory.set(email, { code, expiresAt: Date.now() + OTP_TTL_SECONDS * 1_000 });
  }
}

async function getOTP(email: string): Promise<string | null> {
  try {
    const val = await redis.get(`otp:${email}`);
    if (val !== null) return val;
  } catch { /* fall through to memory */ }
  const entry = otpMemory.get(email);
  if (!entry || Date.now() > entry.expiresAt) { otpMemory.delete(email); return null; }
  return entry.code;
}

async function delOTP(email: string): Promise<void> {
  try {
    await redis.del(`otp:${email}`);
  } catch {
    otpMemory.delete(email);
  }
}

function generateOTP(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

export async function sendOTP(email: string): Promise<void> {
  const otp = generateOTP();
  await setOTP(email, otp);

  // In dev: log to console. In prod: send via SMS/email provider.
  console.info(`[OTP] ${email} → ${otp} (expires in ${OTP_TTL_SECONDS}s)`);
}

export async function verifyOTP(
  email: string,
  code: string,
): Promise<{ token: string; user: User; isNew: boolean }> {
  const stored = await getOTP(email);
  if (!stored || stored !== code) {
    throw new AppError('Invalid or expired OTP', 400);
  }
  await delOTP(email);

  // Upsert user
  let user: User | null;
  try {
    user = await queryOne<User>(
      `SELECT id, email, phone, name, user_type, subscription_tier,
              preferences, interaction_count, created_at
       FROM users WHERE email = $1`,
      [email],
    );
    console.info('[Auth] SELECT user result:', user ? user.id : 'not found');
  } catch (e) {
    console.error('[Auth] SELECT user failed:', e);
    throw new AppError('Database error (select)', 500);
  }

  const isNew = !user;
  if (!user) {
    const name = email.split('@')[0] ?? 'User';
    try {
      user = await queryOne<User>(
        `INSERT INTO users (id, email, name, preferences)
         VALUES ($1, $2, $3, '{}')
         RETURNING id, email, phone, name, user_type, subscription_tier,
                   preferences, interaction_count, created_at`,
        [uuidv4(), email, name],
      );
      console.info('[Auth] INSERT user result:', user ? user.id : 'null');
    } catch (e) {
      console.error('[Auth] INSERT user failed:', e);
      throw new AppError('Database error (insert)', 500);
    }
  }

  if (!user) throw new AppError('Failed to create user', 500);

  await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

  const token = signToken({
    userId: user.id,
    email: user.email,
    subscriptionTier: user.subscription_tier,
  });

  return { token, user, isNew };
}

export async function getProfile(userId: string): Promise<User> {
  const user = await queryOne<User>(
    `SELECT id, email, phone, name, user_type, subscription_tier,
            preferences, interaction_count, created_at
     FROM users WHERE id = $1`,
    [userId],
  );
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function updateProfile(
  userId: string,
  data: { name?: string; phone?: string; user_type?: string; preferences?: UserPreferences },
): Promise<User> {
  const user = await queryOne<User>(
    `UPDATE users
     SET name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         user_type = COALESCE($3, user_type),
         preferences = CASE WHEN $4::jsonb IS NOT NULL THEN $4::jsonb ELSE preferences END
     WHERE id = $5
     RETURNING id, email, phone, name, user_type, subscription_tier,
               preferences, interaction_count, created_at`,
    [
      data.name ?? null,
      data.phone ?? null,
      data.user_type ?? null,
      data.preferences ? JSON.stringify(data.preferences) : null,
      userId,
    ],
  );
  if (!user) throw new AppError('User not found', 404);
  return user;
}
