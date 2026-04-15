import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Home, Search, LogIn, User, LogOut } from 'lucide-react'

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <Home className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">Propellex</h1>
            </div>
            <nav className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  {user?.role === 'admin' ? (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600"
                    >
                      <User className="w-5 h-5" />
                      Admin Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/search"
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600"
                    >
                      <Search className="w-5 h-5" />
                      Search Properties
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600"
                  >
                    <LogIn className="w-5 h-5" />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Find Your Dream Property
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Discover the perfect home with our comprehensive property search and comparison tools
          </p>
          {!isAuthenticated ? (
            <div className="flex gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-lg font-semibold"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 bg-white text-primary-600 rounded-lg hover:bg-gray-50 text-lg font-semibold border-2 border-primary-600"
              >
                Login
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              {user?.role === 'client' ? (
                <Link
                  to="/search"
                  className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-lg font-semibold"
                >
                  Search Properties
                </Link>
              ) : (
                <Link
                  to="/admin"
                  className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-lg font-semibold"
                >
                  Manage Properties
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Search className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Advanced Search</h3>
            <p className="text-gray-600">
              Find properties based on location, price, size, and amenities
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Home className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Property Comparison</h3>
            <p className="text-gray-600">
              Compare multiple properties side-by-side to make informed decisions
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <User className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Expert Agents</h3>
            <p className="text-gray-600">
              Connect with professional real estate agents for guidance
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}




