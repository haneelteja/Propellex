import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Home } from 'lucide-react'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  role: z.enum(['hni_investor', 'agency_admin', 'compliance_officer', 'product_manager']),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'hni_investor',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)
    setError('')
    try {
      const response = await api.post('/auth/register', data)
      const { user, token, refreshToken } = response.data.data
      login(user, token, refreshToken)

      // Redirect based on role
      const roleRoutes: Record<string, string> = {
        hni_investor: '/investor/dashboard',
        agency_admin: '/agency/dashboard',
        compliance_officer: '/compliance/dashboard',
        product_manager: '/admin/dashboard',
      }

      navigate(roleRoutes[user.role] || '/properties')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Home className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">Propellex</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">Sign up to get started</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            {...register('name')}
            type="text"
            label="Full Name"
            placeholder="John Doe"
            error={errors.name?.message}
          />

          <Input
            {...register('email')}
            type="email"
            label="Email"
            placeholder="your@email.com"
            error={errors.email?.message}
          />

          <Input
            {...register('password')}
            type="password"
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
          />

          <Input
            {...register('phone')}
            type="tel"
            label="Phone (Optional)"
            placeholder="+91 1234567890"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <select
              {...register('role')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="hni_investor">HNI Investor</option>
              <option value="agency_admin">Agency Admin</option>
              <option value="compliance_officer">Compliance Officer</option>
              <option value="product_manager">Product Manager</option>
            </select>
          </div>

          <Button type="submit" disabled={loading} isLoading={loading} className="w-full">
            Sign Up
          </Button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
