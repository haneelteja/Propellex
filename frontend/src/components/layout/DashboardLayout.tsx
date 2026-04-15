import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import {
  Home,
  Search,
  BarChart3,
  Building2,
  TrendingUp,
  Shield,
  MessageSquare,
  LogOut,
  User,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { UserRole } from '@/types/shared'

interface DashboardLayoutProps {
  children: ReactNode
}

type NavItem = { name: string; href: string; icon: LucideIcon }

const navigation: Record<UserRole, NavItem[]> = {
  hni_investor: [
    { name: 'Dashboard', href: '/investor/dashboard', icon: Home },
    { name: 'Property Discovery', href: '/properties', icon: Search },
    { name: 'Portfolio', href: '/investor/portfolio', icon: BarChart3 },
    { name: 'Market Intelligence', href: '/market', icon: TrendingUp },
  ],
  agency_admin: [
    { name: 'Dashboard', href: '/agency/dashboard', icon: Home },
    { name: 'Properties', href: '/agency/properties', icon: Building2 },
    { name: 'Agents', href: '/agency/agents', icon: User },
    { name: 'Inquiries', href: '/inquiries', icon: MessageSquare },
  ],
  compliance_officer: [
    { name: 'Dashboard', href: '/compliance/dashboard', icon: Home },
    { name: 'Compliance Records', href: '/compliance/records', icon: Shield },
    { name: 'Reports', href: '/compliance/reports', icon: BarChart3 },
  ],
  product_manager: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'Properties', href: '/properties', icon: Building2 },
    { name: 'Users', href: '/admin/users', icon: User },
    { name: 'Market Intelligence', href: '/market', icon: TrendingUp },
    { name: 'Compliance', href: '/compliance', icon: Shield },
    { name: 'Inquiries', href: '/inquiries', icon: MessageSquare },
  ],
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userNav = user ? navigation[user.role] || [] : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-primary-600">Propellex</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {userNav.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-primary-50 text-primary-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}




