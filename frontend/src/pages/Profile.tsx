import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { auth } from '@/services/api';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { formatRupeesCr } from '@/lib/utils';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const handleSaveName = async () => {
    setSaving(true);
    try {
      const updated = await auth.updateProfile({ name });
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Silently fail
    } finally {
      setSaving(false);
    }
  };

  const prefs = user.preferences;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-navy">Profile</h1>

      {/* Account info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-base font-semibold text-navy">Account</h2>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Email</label>
          <p className="text-sm font-medium text-gray-800">{user.email}</p>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Display Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
            />
            <Button size="sm" loading={saving} onClick={handleSaveName}>
              {saved ? 'Saved ✓' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Plan</label>
            <Badge variant={user.subscription_tier === 'free' ? 'neutral' : 'gold'}>
              {user.subscription_tier ? user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1) : 'Free'}
            </Badge>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Investor Type</label>
            <Badge variant="info">{user.user_type ? user.user_type.replace(/_/g, ' ').toUpperCase() : 'User'}</Badge>
          </div>
        </div>
      </div>

      {/* Investment preferences */}
      {prefs && Object.keys(prefs).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-base font-semibold text-navy">Investment Preferences</h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {(prefs.budget_min != null || prefs.budget_max != null) && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Budget Range</p>
                <p className="font-medium text-navy">
                  {formatRupeesCr(prefs.budget_min ?? 0)} – {formatRupeesCr(prefs.budget_max ?? 0)}
                </p>
              </div>
            )}
            {prefs.roi_target != null && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">ROI Target</p>
                <p className="font-medium text-navy">{prefs.roi_target}% over 3 years</p>
              </div>
            )}
            {prefs.risk_appetite && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Risk Appetite</p>
                <Badge
                  variant={
                    prefs.risk_appetite === 'low'
                      ? 'success'
                      : prefs.risk_appetite === 'medium'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {prefs.risk_appetite.charAt(0).toUpperCase() + prefs.risk_appetite.slice(1)}
                </Badge>
              </div>
            )}
            {prefs.property_types?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Property Types</p>
                <div className="flex flex-wrap gap-1">
                  {prefs.property_types.map((t) => (
                    <Badge key={t} variant="info">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {prefs.localities?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Preferred Localities</p>
              <div className="flex flex-wrap gap-1.5">
                {prefs.localities.map((l) => (
                  <Badge key={l} variant="neutral">{l}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
