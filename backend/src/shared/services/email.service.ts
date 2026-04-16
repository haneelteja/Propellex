import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
})

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  await transporter.sendMail({
    from: `"Propellex" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your Propellex verification code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0284c7; margin: 0;">Propellex</h1>
          <p style="color: #64748b; margin: 4px 0 0;">HNI Property Investment Platform</p>
        </div>
        <div style="background: white; border-radius: 8px; padding: 32px; text-align: center;">
          <p style="color: #1e293b; font-size: 16px; margin: 0 0 16px;">Your verification code is:</p>
          <div style="font-size: 42px; font-weight: 700; letter-spacing: 10px; color: #0284c7; padding: 16px 0;">
            ${code}
          </div>
          <p style="color: #94a3b8; font-size: 14px; margin: 16px 0 0;">
            This code expires in <strong>10 minutes</strong>.<br/>Do not share it with anyone.
          </p>
        </div>
      </div>
    `,
  })
}
