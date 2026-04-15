import { Link } from 'react-router-dom'
import { useCompareStore } from '@/store/compareStore'
import { X, Home, MapPin, BedDouble, Bath, Maximize2, TrendingDown, TrendingUp, CheckCircle2, Circle } from 'lucide-react'

export default function ClientCompare() {
  const { compareList, removeFromCompare, clearCompare } = useCompareStore()

  if (compareList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Home className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Properties to Compare</h2>
          <p className="text-gray-500 mb-6">Add up to 4 properties from the discovery page to compare side-by-side.</p>
          <Link
            to="/properties"
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Browse Properties
          </Link>
        </div>
      </div>
    )
  }

  // Compute best values per row for highlighting
  const prices = compareList.map((p) => p.price)
  const areas = compareList.map((p) => p.specifications.area)
  const bedrooms = compareList.map((p) => p.specifications.bedrooms)
  const bathrooms = compareList.map((p) => p.specifications.bathrooms)
  const pricePerSqft = compareList.map((p) =>
    p.specifications.area ? Math.round(p.price / p.specifications.area) : Infinity
  )

  const minPrice = Math.min(...prices)
  const maxArea = Math.max(...areas)
  const maxBedrooms = Math.max(...bedrooms)
  const maxBathrooms = Math.max(...bathrooms)
  const minPricePerSqft = Math.min(...pricePerSqft)

  const isBest = (val: number, bestVal: number) => val === bestVal

  // Collect all unique amenities across all properties
  const allAmenities = Array.from(
    new Set(compareList.flatMap((p) => p.amenities ?? []))
  ).sort()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Compare Properties</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {compareList.length} {compareList.length === 1 ? 'property' : 'properties'} selected
                {compareList.length < 4 && (
                  <span className="ml-1 text-primary-500">
                    — <Link to="/properties" className="underline hover:text-primary-700">add {4 - compareList.length} more</Link>
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/properties"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                ← Back to Search
              </Link>
              <button
                onClick={clearCompare}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Legend */}
        <div className="flex items-center gap-4 mb-5 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-green-100 border border-green-400" />
            Best value in this row
          </span>
          <span className="flex items-center gap-1.5">
            <TrendingDown className="w-3 h-3 text-green-600" />
            Lower is better
          </span>
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-blue-600" />
            Higher is better
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">

              {/* Property Header Cards */}
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-40 px-6 py-5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                    Property
                  </th>
                  {compareList.map((property) => (
                    <th key={property._id} className="px-4 py-4 min-w-[220px] align-top">
                      <div className="relative">
                        <button
                          onClick={() => removeFromCompare(property._id)}
                          className="absolute -top-1 -right-1 p-1 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 shadow-sm z-10"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        {property.images?.[0] ? (
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-36 object-cover rounded-lg mb-3"
                          />
                        ) : (
                          <div className="w-full h-36 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                            <Home className="w-10 h-10 text-gray-300" />
                          </div>
                        )}
                        <p className="font-semibold text-gray-900 text-sm leading-tight mb-1 pr-4">
                          {property.title}
                        </p>
                        <div className="flex items-center text-gray-400 text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {property.location.city}, {property.location.state}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Price */}
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 flex items-center gap-1.5 whitespace-nowrap">
                    <TrendingDown className="w-3.5 h-3.5 text-green-500" />
                    Price
                  </td>
                  {compareList.map((p) => (
                    <td
                      key={p._id}
                      className={`px-4 py-4 text-sm font-bold ${
                        isBest(p.price, minPrice)
                          ? 'text-green-700 bg-green-50'
                          : 'text-gray-900'
                      }`}
                    >
                      ₹{p.price.toLocaleString('en-IN')}
                      {isBest(p.price, minPrice) && compareList.length > 1 && (
                        <span className="ml-1.5 text-xs font-normal text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                          Best
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Price / sqft */}
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 flex items-center gap-1.5 whitespace-nowrap">
                    <TrendingDown className="w-3.5 h-3.5 text-green-500" />
                    Price / sqft
                  </td>
                  {compareList.map((p, i) => (
                    <td
                      key={p._id}
                      className={`px-4 py-4 text-sm font-semibold ${
                        isBest(pricePerSqft[i], minPricePerSqft)
                          ? 'text-green-700 bg-green-50'
                          : 'text-gray-900'
                      }`}
                    >
                      {pricePerSqft[i] !== Infinity
                        ? `₹${pricePerSqft[i].toLocaleString('en-IN')}`
                        : '—'}
                      {isBest(pricePerSqft[i], minPricePerSqft) && compareList.length > 1 && (
                        <span className="ml-1.5 text-xs font-normal text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                          Best
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Location */}
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 whitespace-nowrap">
                    Location
                  </td>
                  {compareList.map((p) => (
                    <td key={p._id} className="px-4 py-4 text-sm text-gray-700">
                      <div className="font-medium">{p.location.city}</div>
                      <div className="text-gray-400 text-xs">{p.location.state}</div>
                      {p.location.address && (
                        <div className="text-gray-400 text-xs mt-0.5 truncate max-w-[180px]">
                          {p.location.address}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Type */}
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 whitespace-nowrap">
                    Property Type
                  </td>
                  {compareList.map((p) => (
                    <td key={p._id} className="px-4 py-4">
                      <span className="inline-block px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full capitalize">
                        {p.type}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Bedrooms */}
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 flex items-center gap-1.5 whitespace-nowrap">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                    <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                    Bedrooms
                  </td>
                  {compareList.map((p) => (
                    <td
                      key={p._id}
                      className={`px-4 py-4 text-sm font-semibold ${
                        isBest(p.specifications.bedrooms, maxBedrooms)
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-gray-900'
                      }`}
                    >
                      {p.specifications.bedrooms}
                    </td>
                  ))}
                </tr>

                {/* Bathrooms */}
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 flex items-center gap-1.5 whitespace-nowrap">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                    <Bath className="w-3.5 h-3.5 text-gray-400" />
                    Bathrooms
                  </td>
                  {compareList.map((p) => (
                    <td
                      key={p._id}
                      className={`px-4 py-4 text-sm font-semibold ${
                        isBest(p.specifications.bathrooms, maxBathrooms)
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-gray-900'
                      }`}
                    >
                      {p.specifications.bathrooms}
                    </td>
                  ))}
                </tr>

                {/* Area */}
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 flex items-center gap-1.5 whitespace-nowrap">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                    <Maximize2 className="w-3.5 h-3.5 text-gray-400" />
                    Area
                  </td>
                  {compareList.map((p) => (
                    <td
                      key={p._id}
                      className={`px-4 py-4 text-sm font-semibold ${
                        isBest(p.specifications.area, maxArea)
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-gray-900'
                      }`}
                    >
                      {p.specifications.area.toLocaleString()} sqft
                    </td>
                  ))}
                </tr>

                {/* Amenities — one row per amenity with checkmarks */}
                {allAmenities.length > 0 && (
                  <tr className="border-b border-gray-100">
                    <td
                      colSpan={compareList.length + 1}
                      className="px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      Amenities
                    </td>
                  </tr>
                )}
                {allAmenities.map((amenity) => (
                  <tr key={amenity} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-sm text-gray-600 bg-gray-50 capitalize">
                      {amenity}
                    </td>
                    {compareList.map((p) => {
                      const has = p.amenities?.includes(amenity)
                      return (
                        <td key={p._id} className="px-4 py-3">
                          {has ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-200" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {/* Actions */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-5 text-sm font-medium text-gray-600 whitespace-nowrap">
                    Actions
                  </td>
                  {compareList.map((p) => (
                    <td key={p._id} className="px-4 py-5">
                      <div className="flex flex-col gap-2">
                        <Link
                          to={`/properties/${p._id}`}
                          className="block text-center py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => removeFromCompare(p._id)}
                          className="block w-full text-center py-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
