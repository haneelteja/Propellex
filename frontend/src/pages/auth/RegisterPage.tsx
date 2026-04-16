import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Home, ArrowLeft } from 'lucide-react'

const ROLE_OPTIONS = [
  { value: 'hni_investor', label: 'HNI Investor' },
  { value: 'agency_admin', label: 'Agency Admin' },
  { value: 'compliance_officer', label: 'Compliance Officer' },
  { value: 'product_manager', label: 'Product Manager' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [step, setStep] = useState<'details' | 'otp'>('details')
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'hni_investor' })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email) return
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/send-otp', {
        email: form.email,
        name: form.name,
        role: form.role,
        phone: form.phone || undefined,
      })
      setStep('otp')
      startResendCooldown()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const startResendCooldown = () => {
    setResendCooldown(30)
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const updated = [...otp]
    updated[index] = value.slice(-1)
    setOtp(updated)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) return
    setLoading(true)
    setError('')
    try {
      const response = await api.post('/auth/verify-otp', { email: form.email, code })
      const { user, token, refreshToken } = response.data.data
      login(user, token, refreshToken)

      const roleRoutes: Record<string, string> = {
        hni_investor: '/investor/dashboard',
        agency_admin: '/agency/dashboard',
        compliance_officer: '/compliance/dashboard',
        product_manager: '/admin/dashboard',
      }
      navigate(roleRoutes[user.role] || '/properties')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid code. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Home className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">Propellex</span>
          </Link>
          {step === 'details' ? (
            <>
              <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
              <p className="text-gray-500 mt-2">Sign up to get started</p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-gray-900">Verify your email</h2>
              <p className="text-gray-500 mt-2">
                We sent a 6-digit code to<br />
                <span className="font-semibold text-gray-700">{form.email}</span>
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 1 — Details */}
        {step === 'details' && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <Input
              type="text"
              label="Full Name"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              type="email"
              label="Email address"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              type="tel"
              label="Phone (Optional)"
              placeholder="+91 9876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={loading} isLoading={loading} className="w-full">
              Send Verification Code
            </Button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Enter verification code
              </label>
              <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-colors"
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              isLoading={loading}
              className="w-full"
            >
              Verify & Create Account
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => { setStep('details'); setOtp(['', '', '', '', '', '']); setError('') }}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={resendCooldown > 0}
                className="text-primary-600 hover:text-primary-700 disabled:text-gray-400"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-gray-600 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
