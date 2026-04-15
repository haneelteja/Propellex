import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { MapPin, Home, Bath, Car } from 'lucide-react'
import { useCompareStore } from '@/store/compareStore'

export default function PropertyDetails() {
  const { id } = useParams()
  const { addToCompare } = useCompareStore()

  const { data, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await api.get(`/properties/${id}`)
      return response.data.property
    },
    enabled: !!id,
  })

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  if (!data) {
    return <div className="p-8">Property not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/search" className="text-primary-600 hover:text-primary-700">
            ← Back to Search
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {data.images?.[0] && (
            <img
              src={data.images[0]}
              alt={data.title}
              className="w-full h-96 object-cover"
            />
          )}

          <div className="p-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.title}</h1>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-1" />
                  {data.location.address}, {data.location.city}, {data.location.state}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600">
                  ${data.price.toLocaleString()}
                </div>
                <span className="text-sm text-gray-600">{data.currency}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">{data.specifications.bedrooms} Bedrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">{data.specifications.bathrooms} Bathrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">{data.specifications.area} sqft</span>
              </div>
              {data.specifications.parking && (
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">{data.specifications.parking} Parking</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{data.description}</p>
            </div>

            {data.amenities && data.amenities.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {data.amenities.map((amenity: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => addToCompare(data)}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Add to Compare
              </button>
              <Link
                to="/compare"
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                View Comparison
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}




