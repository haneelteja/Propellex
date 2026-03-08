import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { properties as propertiesApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/shared/Button';
import { formatRupeesCr } from '@/lib/utils';
import type { AgencyPropertyForm, Property } from '@/types';

const LOCALITIES = [
  'Jubilee Hills', 'Banjara Hills', 'Gachibowli', 'Kondapur',
  'Kokapet', 'Hitech City', 'Madhapur', 'Nanakramguda',
];

const AMENITIES_LIST = [
  'Swimming Pool', 'Gym', 'Clubhouse', 'CCTV Security', '24/7 Power Backup',
  'Car Parking', 'Children Play Area', 'Jogging Track', 'Landscaped Gardens',
  'Conference Room', 'Cafeteria', 'Visitor Parking',
];

const EMPTY_FORM: AgencyPropertyForm = {
  title: '',
  description: '',
  property_type: 'residential',
  status: 'ready_to_move',
  price_cr: 1,
  area_sqft: 1000,
  bedrooms: 3,
  bathrooms: 2,
  locality: 'Gachibowli',
  pincode: '',
  lat: null,
  lng: null,
  builder_name: '',
  rera_number: '',
  amenities: [],
  photos: [],
};

function parseGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  // Format 1: /@lat,lng,zoom (most common share link)
  const atMatch = url.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]!), lng: parseFloat(atMatch[2]!) };
  // Format 2: ?q=lat,lng or &q=lat,lng
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d+),(-?\d+\.?\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]!), lng: parseFloat(qMatch[2]!) };
  // Format 3: ?ll=lat,lng
  const llMatch = url.match(/[?&]ll=(-?\d+\.?\d+),(-?\d+\.?\d+)/);
  if (llMatch) return { lat: parseFloat(llMatch[1]!), lng: parseFloat(llMatch[2]!) };
  return null;
}

export default function AgencyDashboard() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<AgencyPropertyForm>({ ...EMPTY_FORM });
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [mapsError, setMapsError] = useState('');

  // Load this agency's properties (search with no filters shows all active)
  const { data: allProps, isLoading } = useQuery({
    queryKey: ['agency-properties'],
    queryFn: () => propertiesApi.search({ limit: 100 }),
    select: (res) => res.data ?? [],
  });

  const createMutation = useMutation({
    mutationFn: (data: AgencyPropertyForm) => propertiesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agency-properties'] }); setShowForm(false); setForm({ ...EMPTY_FORM }); setMapsUrl(''); setMapsError(''); setError(''); },
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AgencyPropertyForm> }) => propertiesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agency-properties'] }); setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }); setMapsUrl(''); setMapsError(''); setError(''); },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => propertiesApi.remove(id),
    onSuccess: () => {
      setConfirmDeleteId(null);
      setDeleteError('');
      qc.invalidateQueries({ queryKey: ['agency-properties'] });
    },
    onError: (e: Error) => setDeleteError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  function startEdit(prop: Property) {
    setEditingId(prop.id);
    setForm({
      title: prop.title,
      description: prop.description,
      property_type: prop.property_type,
      status: prop.status,
      price_cr: +(prop.price / 1_00_00_000).toFixed(2),
      area_sqft: prop.area_sqft,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      locality: prop.locality,
      builder_name: prop.builder_name,
      rera_number: prop.rera_number,
      amenities: prop.amenities,
      photos: prop.photos,
    });
    setShowForm(true);
  }

  function toggleAmenity(a: string) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities?.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...(f.amenities ?? []), a],
    }));
  }

  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-semibold text-gray-700 mb-2">Admin Portal</p>
        <p className="text-gray-500 mb-6">This area is for admin users only.</p>
        <p className="text-sm text-gray-400">
          Contact your manager to grant admin access to your account.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage property listings</p>
        </div>
        <Button onClick={() => { setEditingId(null); setForm({ ...EMPTY_FORM }); setMapsUrl(''); setMapsError(''); setShowForm(true); setError(''); }}>
          + Add Property
        </Button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-navy mb-6">
            {editingId ? 'Edit Property' : 'Add New Property'}
          </h2>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. 3BHK Premium Apartment in Gachibowli"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe the property..."
              />
            </div>

            {/* Row 1: Type, Status, Locality */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.property_type}
                  onChange={(e) => setForm((f) => ({ ...f, property_type: e.target.value as AgencyPropertyForm['property_type'] }))}
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="plot">Plot</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Possession Status</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AgencyPropertyForm['status'] }))}
                >
                  <option value="ready_to_move">Ready to Move</option>
                  <option value="under_construction">Under Construction</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Locality</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.locality}
                  onChange={(e) => setForm((f) => ({ ...f, locality: e.target.value }))}
                >
                  {LOCALITIES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2: Price, Area, Bedrooms, Bathrooms */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹ Cr) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.price_cr}
                  onChange={(e) => setForm((f) => ({ ...f, price_cr: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area (sq.ft) *</label>
                <input
                  type="number"
                  min="100"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.area_sqft}
                  onChange={(e) => setForm((f) => ({ ...f, area_sqft: parseInt(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.bedrooms ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value ? parseInt(e.target.value) : null }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.bathrooms ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value ? parseInt(e.target.value) : null }))}
                />
              </div>
            </div>

            {/* Row 3: Builder, RERA, Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Builder Name</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.builder_name ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, builder_name: e.target.value }))}
                  placeholder="e.g. Prestige Group"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RERA Number</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.rera_number ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, rera_number: e.target.value }))}
                  placeholder="e.g. HYD-RERA-2024001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={form.pincode ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                  placeholder="e.g. 500032"
                />
              </div>
            </div>

            {/* Google Maps location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Maps Link
                <span className="ml-1 text-xs text-gray-400 font-normal">(paste to auto-fill coordinates)</span>
              </label>
              <input
                type="url"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                value={mapsUrl}
                onChange={(e) => {
                  const url = e.target.value;
                  setMapsUrl(url);
                  if (!url) { setMapsError(''); return; }
                  const coords = parseGoogleMapsUrl(url);
                  if (coords) {
                    setForm((f) => ({ ...f, lat: coords.lat, lng: coords.lng }));
                    setMapsError('');
                  } else {
                    setMapsError('Could not extract coordinates. Paste the full Google Maps share link.');
                  }
                }}
                placeholder="https://www.google.com/maps/place/.../@17.4401,78.3489,..."
              />
              {mapsError && <p className="text-xs text-red-500 mt-1">{mapsError}</p>}
              {form.lat != null && form.lng != null && !mapsError && (
                <p className="text-xs text-green-600 mt-1">
                  Coordinates detected: {form.lat.toFixed(6)}, {form.lng.toFixed(6)}
                </p>
              )}
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES_LIST.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      form.amenities?.includes(a)
                        ? 'bg-brand text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Price preview */}
            {form.price_cr > 0 && (
              <p className="text-sm text-brand font-medium">
                Price: {formatRupeesCr(form.price_cr * 1_00_00_000 * 100)}
                {form.area_sqft > 0 && ` · ₹${Math.round(form.price_cr * 1_00_00_000 / form.area_sqft).toLocaleString('en-IN')}/sq.ft`}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Update Property' : 'Publish Property'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }); setMapsUrl(''); setMapsError(''); setError(''); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Listings Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">My Listings</h2>
          {deleteError && <p className="text-xs text-red-500 mt-1">{deleteError}</p>}
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading properties...</div>
        ) : !allProps?.length ? (
          <div className="p-8 text-center text-gray-400 text-sm">No properties yet. Click "Add Property" to get started.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {allProps.map((prop) => (
              <div key={prop.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                {/* Photo thumbnail */}
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {prop.photos?.[0] ? (
                    <img src={prop.photos[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No photo</div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{prop.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{prop.locality} · {prop.area_sqft.toLocaleString()} sq.ft</p>
                </div>
                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-navy text-sm">{formatRupeesCr(prop.price * 100)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    prop.rera_status === 'verified' ? 'bg-green-50 text-green-700' :
                    prop.rera_status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    RERA {prop.rera_status}
                  </span>
                </div>
                {/* Actions */}
                <div className="flex-shrink-0">
                  {confirmDeleteId === prop.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 mr-1">Delete?</span>
                      <button
                        onClick={() => deleteMutation.mutate(prop.id)}
                        disabled={deleteMutation.isPending}
                        className="text-xs bg-red-500 text-white font-medium px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                      >
                        {deleteMutation.isPending ? '...' : 'Yes'}
                      </button>
                      <button
                        onClick={() => { setConfirmDeleteId(null); setDeleteError(''); }}
                        className="text-xs text-gray-500 font-medium px-2 py-1 rounded hover:bg-gray-100"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(prop)}
                        className="text-xs text-brand hover:text-navy font-medium px-2 py-1 rounded hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => { setConfirmDeleteId(prop.id); setDeleteError(''); }}
                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
