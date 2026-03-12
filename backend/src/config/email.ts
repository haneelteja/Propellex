import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// ── HTML template ─────────────────────────────────────────────────────────────


function otpHtml(otp: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Propellex OTP</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1E3A5F;padding:28px 32px;text-align:center;">
              <span style="font-size:22px;font-weight:700;color:#C9A84C;letter-spacing:0.5px;">Propellex</span>
              <p style="margin:4px 0 0;font-size:12px;color:#9bb4cc;letter-spacing:1px;text-transform:uppercase;">Real Estate Intelligence</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 8px;font-size:20px;color:#1E3A5F;font-weight:600;">Your login code</h2>
              <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">
                Use the code below to sign in to your Propellex account. It expires in <strong>10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="background:#F8FAFC;border:2px dashed #2E86AB;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#1E3A5F;font-family:'Courier New',monospace;">${otp}</span>
              </div>

              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} Propellex · Hyderabad Real Estate Intelligence
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Brevo HTTP API ────────────────────────────────────────────────────────────
// Uses port 443 (HTTPS) — never blocked by cloud providers like Render.
// Brevo free tier: 300 emails/day, any recipient, no verified domain needed.
//
// Set these in Render env:
//   BREVO_API_KEY=your-brevo-api-key   (Brevo → Settings → API Keys → Create)
//   BREVO_SENDER_EMAIL=your-verified-sender@yourdomain.com  (or your Brevo login)

async function sendViaBrevoApi(to: string, otp: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY!;
  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? process.env.SMTP_USER ?? 'noreply@propellex.ai';
  const senderName = process.env.SMTP_FROM_NAME ?? 'Propellex';
  console.info(`[Email] Sending via Brevo API — from: ${senderEmail} → to: ${to}`);

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject: `${otp} — your Propellex login code`,
      htmlContent: otpHtml(otp),
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[Email] Brevo API rejected (${res.status}) — body: ${body.slice(0, 400)}`);
    throw new Error(`Brevo API ${res.status}: ${body.slice(0, 200)}`);
  }
  console.info(`[Email] Brevo API accepted (${res.status})`);
}

// ── Generic SMTP (Nodemailer) ─────────────────────────────────────────────────
// Fallback option — Render blocks outbound port 587, so this only works in
// local dev or on providers that allow SMTP egress.
//
// Set these in Render env (optional — Brevo API is preferred):
//   SMTP_HOST=smtp-relay.brevo.com
//   SMTP_PORT=587
//   SMTP_USER=your-brevo-login-email
//   SMTP_PASS=your-brevo-smtp-key   (Settings → SMTP & API → SMTP Keys)

function hasSmtpConfig(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendViaSmtp(to: string, otp: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: false,  // STARTTLS on port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 5_000,  // 5s to establish TCP connection
    greetingTimeout: 5_000,    // 5s to receive SMTP server greeting
    socketTimeout: 10_000,     // 10s max for any SMTP command
  });

  const fromName = process.env.SMTP_FROM_NAME ?? 'Propellex';
  const fromAddr = process.env.SMTP_USER!;

  await transporter.sendMail({
    from: `${fromName} <${fromAddr}>`,
    to,
    subject: `${otp} — your Propellex login code`,
    html: otpHtml(otp),
  });
}

// ── Resend ────────────────────────────────────────────────────────────────────
// Requires RESEND_API_KEY + a verified sending domain in EMAIL_FROM.
// onboarding@resend.dev only delivers to the Resend account owner's email.

async function sendViaResend(to: string, otp: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? 'Propellex <onboarding@resend.dev>';

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `${otp} — your Propellex login code`,
    html: otpHtml(otp),
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  // Always log — OTP is visible in Render logs as a guaranteed fallback
  console.info(`[OTP] Sending to ${to} — code: ${otp}`);

  // Priority 1: Brevo HTTP API (port 443 — works on Render, no SMTP egress needed)
  if (process.env.BREVO_API_KEY) {
    try {
      await sendViaBrevoApi(to, otp);
      console.info(`[OTP] Delivered via Brevo API to ${to}`);
      return;
    } catch (err) {
      console.error('[Email] Brevo API failed:', (err as Error).message);
      // fall through to SMTP
    }
  }

  // Priority 2: Generic SMTP (works locally; Render blocks port 587)
  if (hasSmtpConfig()) {
    try {
      await sendViaSmtp(to, otp);
      console.info(`[OTP] Delivered via SMTP (${process.env.SMTP_HOST}) to ${to}`);
      return;
    } catch (err) {
      console.error(`[Email] SMTP failed (host: ${process.env.SMTP_HOST}):`, (err as Error).message);
      // fall through to Resend
    }
  }

  // Priority 3: Resend (requires verified domain for arbitrary recipients)
  if (process.env.RESEND_API_KEY) {
    try {
      await sendViaResend(to, otp);
      console.info(`[OTP] Delivered via Resend to ${to}`);
      return;
    } catch (err) {
      console.error('[Email] Resend failed:', (err as Error).message);
    }
  }

  // No transport configured — OTP is in Render logs, user must retrieve it there
  if (!process.env.BREVO_API_KEY && !hasSmtpConfig() && !process.env.RESEND_API_KEY) {
    console.warn('[OTP] No email transport configured. Set BREVO_API_KEY (recommended) or SMTP_HOST+SMTP_USER+SMTP_PASS.');
  }
}
