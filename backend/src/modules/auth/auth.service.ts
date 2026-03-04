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

function generateOTP(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

export async function sendOTP(email: string): Promise<void> {
  const otp = generateOTP();
  const key = `otp:${email}`;
  await redis.set(key, otp, 'EX', OTP_TTL_SECONDS);

  // In dev: log to console. In prod: send via SMS/email provider.
  console.info(`[OTP] ${email} → ${otp} (expires in ${OTP_TTL_SECONDS}s)`);
}

export async function verifyOTP(
  email: string,
  code: string,
): Promise<{ token: string; user: User; isNew: boolean }> {
  const key = `otp:${email}`;
  const stored = await redis.get(key);
  if (!stored || stored !== code) {
    throw new AppError('Invalid or expired OTP', 400);
  }
  await redis.del(key);

  // Upsert user
  let user = await queryOne<User>(
    `SELECT id, email, phone, name, user_type, subscription_tier,
            preferences, interaction_count, created_at
     FROM users WHERE email = $1`,
    [email],
  );

  const isNew = !user;
  if (!user) {
    const name = email.split('@')[0] ?? 'User';
    user = await queryOne<User>(
      `INSERT INTO users (id, email, name, preferences)
       VALUES ($1, $2, $3, '{}')
       RETURNING id, email, phone, name, user_type, subscription_tier,
                 preferences, interaction_count, created_at`,
      [uuidv4(), email, name],
    );
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
