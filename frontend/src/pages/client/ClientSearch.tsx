import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { Search, Home, MapPin } from 'lucide-react'
import { useCompareStore } from '@/store/compareStore'

export default function ClientSearch() {
  const [searchParams, setSearchParams] = useState({
    query: '',
    city: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
  })

  const { data, isLoading } = useQuery(
    ['properties', searchParams],
    async () => {
      const params = new URLSearchParams()
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      const response = await api.get(`/properties/search?${params.toString()}`)
      return response.data
    },
    { enabled: Object.values(searchParams).some((v) => v !== '') }
  )

  const { addToCompare, compareList } = useCompareStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Search Properties</h1>
            <Link
              to="/compare"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Compare ({compareList.length})
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by keyword..."
              value={searchParams.query}
              onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="City"
              value={searchParams.city}
              onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select
              value={searchParams.type}
              onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="villa">Villa</option>
              <option value="commercial">Commercial</option>
              <option value="land">Land</option>
            </select>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <input
              type="number"
              placeholder="Min Price"
              value={searchParams.minPrice}
              onChange={(e) => setSearchParams({ ...searchParams, minPrice: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={searchParams.maxPrice}
              onChange={(e) => setSearchParams({ ...searchParams, maxPrice: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Bedrooms"
              value={searchParams.bedrooms}
              onChange={(e) => setSearchParams({ ...searchParams, bedrooms: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Bathrooms"
              value={searchParams.bathrooms}
              onChange={(e) => setSearchParams({ ...searchParams, bathrooms: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : data?.properties?.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {data.properties.map((property: any) => (
              <div key={property._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {property.images?.[0] && (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.title}</h3>
                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {property.location.city}, {property.location.state}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Home className="w-4 h-4 mr-1" />
                      {property.specifications.bedrooms} bed
                    </div>
                    <div>{property.specifications.bathrooms} bath</div>
                    <div>{property.specifications.area} sqft</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary-600">
                      ${property.price.toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      <Link
                        to={`/property/${property._id}`}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => addToCompare(property)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                      >
                        Compare
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>No properties found. Try adjusting your search criteria.</p>
          </div>
        )}
      </main>
    </div>
  )
}




