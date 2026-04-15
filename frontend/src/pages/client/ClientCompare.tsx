import { Link } from 'react-router-dom'
import { useCompareStore } from '@/store/compareStore'
import { X, Home, MapPin } from 'lucide-react'

export default function ClientCompare() {
  const { compareList, removeFromCompare, clearCompare } = useCompareStore()

  if (compareList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Home className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Properties to Compare</h2>
          <p className="text-gray-600 mb-4">Add properties from the search page to compare them.</p>
          <Link
            to="/search"
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Search Properties
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Compare Properties</h1>
            <button
              onClick={clearCompare}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear All
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Property</th>
                {compareList.map((property) => (
                  <th key={property._id} className="px-6 py-4 text-left text-sm font-medium text-gray-500 relative">
                    <button
                      onClick={() => removeFromCompare(property._id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="pr-8">
                      {property.images?.[0] && (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                      )}
                      <h3 className="font-semibold text-gray-900">{property.title}</h3>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Price</td>
                {compareList.map((property) => (
                  <td key={property._id} className="px-6 py-4 text-sm text-gray-600">
                    ${property.price.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Location</td>
                {compareList.map((property) => (
                  <td key={property._id} className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {property.location.city}, {property.location.state}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Type</td>
                {compareList.map((property) => (
                  <td key={property._id} className="px-6 py-4 text-sm text-gray-600">
                    {property.type}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Bedrooms</td>
                {compareList.map((property) => (
                  <td key={property._id} className="px-6 py-4 text-sm text-gray-600">
                    {property.specifications.bedrooms}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Bathrooms</td>
                {compareList.map((property) => (
                  <td key={property._id} className="px-6 py-4 text-sm text-gray-600">
                    {property.specifications.bathrooms}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Area</td>
                {compareList.map((property) => (
                  <td key={property._id} className="px-6 py-4 text-sm text-gray-600">
                    {property.specifications.area} sqft
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Amenities</td>
                {compareList.map((property) => (
                  <td key={property._id} className="px-6 py-4 text-sm text-gray-600">
                    <ul className="list-disc list-inside">
                      {property.amenities?.slice(0, 3).map((amenity: string, idx: number) => (
                        <li key={idx}>{amenity}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Actions</td>
                {compareList.map((property) => (
                  <td key={property._id} className="px-6 py-4">
                    <Link
                      to={`/property/${property._id}`}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                    >
                      View Details
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}




