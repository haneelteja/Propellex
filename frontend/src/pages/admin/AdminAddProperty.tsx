import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import { toast } from '@/components/ui/toaster'

export default function AdminAddProperty() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    if (isEdit) {
      api.get(`/properties/${id}`).then((res) => {
        const property = res.data.property
        Object.keys(property).forEach((key) => {
          if (key === 'location') {
            setValue('address', property.location.address)
            setValue('city', property.location.city)
            setValue('state', property.location.state)
            setValue('zipCode', property.location.zipCode)
          } else if (key === 'specifications') {
            setValue('bedrooms', property.specifications.bedrooms)
            setValue('bathrooms', property.specifications.bathrooms)
            setValue('area', property.specifications.area)
          } else {
            setValue(key, property[key])
          }
        })
      })
    }
  }, [id, isEdit, setValue])

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const propertyData = {
        title: data.title,
        description: data.description,
        type: data.type,
        price: Number(data.price),
        location: {
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: 'USA',
        },
        specifications: {
          bedrooms: Number(data.bedrooms),
          bathrooms: Number(data.bathrooms),
          area: Number(data.area),
          areaUnit: 'sqft',
        },
        amenities: data.amenities?.split(',').map((a: string) => a.trim()) || [],
        status: data.status || 'available',
      }

      if (isEdit) {
        await api.put(`/properties/${id}`, propertyData)
        toast.success('Property updated successfully!')
      } else {
        await api.post('/properties', propertyData)
        toast.success('Property created successfully!')
      }
      navigate('/admin/properties')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save property')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Property' : 'Add New Property'}
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message as string}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select {...register('type', { required: true })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="villa">Villa</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
              <input
                {...register('price', { required: 'Price is required' })}
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              {...register('address', { required: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input {...register('city', { required: true })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input {...register('state', { required: true })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
              <input {...register('zipCode', { required: true })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
              <input
                {...register('bedrooms', { required: true })}
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
              <input
                {...register('bathrooms', { required: true })}
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Area (sqft)</label>
              <input
                {...register('area', { required: true })}
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amenities (comma-separated)</label>
            <input
              {...register('amenities')}
              placeholder="Swimming Pool, Gym, Parking, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select {...register('status')} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Property' : 'Create Property'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/properties')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}




