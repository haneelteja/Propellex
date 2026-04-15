import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { TrendingUp, Home, DollarSign, BarChart3 } from 'lucide-react'

export default function InvestorDashboard() {
  const { isLoading } = useQuery({
    queryKey: ['investor-dashboard'],
    queryFn: async () => {
      const response = await api.get('/investor/dashboard')
      return response.data
    },
  })

  if (isLoading) {
    return <div className="text-center py-12">Loading dashboard...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Investor Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Investments</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">₹0</p>
            </div>
            <DollarSign className="w-12 h-12 text-primary-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">₹0</p>
            </div>
            <Home className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">ROI</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">0%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Watchlist</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <BarChart3 className="w-12 h-12 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-600">No recent activity to display.</p>
      </div>
    </div>
  )
}




