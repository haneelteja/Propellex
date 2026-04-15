import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { Search, MapPin, Home, BedDouble, Bath, Maximize2, BarChart3, X, SlidersHorizontal } from 'lucide-react'
import { useCompareStore } from '@/store/compareStore'

interface Property {
  _id: string
  title: string
  price: number
  location: { city: string; state: string; address: string }
  type: string
  specifications: { bedrooms: number; bathrooms: number; area: number }
  amenities: string[]
  images?: string[]
}

export default function PropertyDiscovery() {
  const [filters, setFilters] = useState({
    city: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
  })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const { compareList, addToCompare, removeFromCompare } = useCompareStore()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['properties-discovery', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v) })
      const res = await api.get(`/properties/search?${params.toString()}`)
      return res.data
    },
    enabled: false,
  })

  const handleSearch = () => {
    setHasSearched(true)
    refetch()
  }

  const isInCompare = (id: string) => compareList.some((p) => p._id === id)

  const handleCompareToggle = (property: Property) => {
    if (isInCompare(property._id)) {
      removeFromCompare(property._id)
    } else {
      addToCompare(property)
    }
  }

  const properties: Property[] = data?.properties ?? []

  return (
    <div className="relative pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Property Discovery</h1>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by city, locality, or keyword..."
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm"
          >
            Search
          </button>
        </div>

        {/* Expanded Filters */}
        {filtersOpen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="villa">Villa</option>
              <option value="commercial">Commercial</option>
              <option value="land">Land</option>
            </select>
            <input
              type="number"
              placeholder="Min Price (₹)"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="number"
              placeholder="Max Price (₹)"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={filters.bedrooms}
              onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Any Bedrooms</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((property) => {
            const inCompare = isInCompare(property._id)
            const pricePerSqft = property.specifications.area
              ? Math.round(property.price / property.specifications.area)
              : null

            return (
              <div
                key={property._id}
                className={`bg-white rounded-xl shadow-md overflow-hidden transition-all ${
                  inCompare ? 'ring-2 ring-primary-500' : 'hover:shadow-lg'
                }`}
              >
                {/* Image */}
                <div className="relative h-44 bg-gray-100">
                  {property.images?.[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 px-2 py-1 bg-white/90 text-gray-700 text-xs font-medium rounded-full capitalize">
                    {property.type}
                  </span>
                  {inCompare && (
                    <span className="absolute top-3 right-3 px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
                      In Compare
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate mb-1">{property.title}</h3>
                  <div className="flex items-center text-gray-500 text-xs mb-3">
                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                    {property.location.city}, {property.location.state}
                  </div>

                  {/* Specs */}
                  <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <BedDouble className="w-3.5 h-3.5" />
                      {property.specifications.bedrooms} Bed
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5" />
                      {property.specifications.bathrooms} Bath
                    </span>
                    <span className="flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5" />
                      {property.specifications.area.toLocaleString()} sqft
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-lg font-bold text-primary-700">
                        ₹{property.price.toLocaleString('en-IN')}
                      </p>
                      {pricePerSqft && (
                        <p className="text-xs text-gray-400">
                          ₹{pricePerSqft.toLocaleString('en-IN')}/sqft
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/properties/${property._id}`}
                      className="flex-1 text-center py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleCompareToggle(property)}
                      title={inCompare ? 'Remove from compare' : 'Add to compare'}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        inCompare
                          ? 'bg-primary-100 text-primary-700 hover:bg-red-50 hover:text-red-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-700'
                      }`}
                    >
                      {inCompare ? <X className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : hasSearched ? (
        <div className="text-center py-20 text-gray-500">
          <Search className="w-14 h-14 mx-auto mb-4 text-gray-300" />
          <p className="font-medium text-gray-700">No properties found</p>
          <p className="text-sm mt-1">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <Search className="w-14 h-14 mx-auto mb-4 text-gray-300" />
          <p className="font-medium text-gray-700">Search for properties</p>
          <p className="text-sm mt-1">Enter a city or keyword above to discover properties</p>
        </div>
      )}

      {/* Floating Compare Tray */}
      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-64 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-x-auto flex-1">
              <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                Compare ({compareList.length}/4):
              </span>
              {compareList.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap"
                >
                  <span className="text-primary-800 font-medium max-w-[120px] truncate">{p.title}</span>
                  <button
                    onClick={() => removeFromCompare(p._id)}
                    className="text-primary-400 hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <Link
              to="/compare"
              className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-sm whitespace-nowrap"
            >
              Compare Now →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
