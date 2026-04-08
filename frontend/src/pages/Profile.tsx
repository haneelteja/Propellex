import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { auth, billing } from '@/services/api';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { formatRupeesCr } from '@/lib/utils';

// Razorpay types (loaded dynamically via CDN script)
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string };
  theme: { color: string };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal: { ondismiss: () => void };
}
interface RazorpayInstance {
  open(): void;
}

async function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

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

  const handleUpgrade = async () => {
    setUpgradeError(null);
    setUpgrading(true);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setUpgradeError('Could not load Razorpay. Check your internet connection.');
        return;
      }

      const order = await billing.createOrder();

      const rzp = new window.Razorpay({
        key:         order.key_id,
        amount:      order.amount,
        currency:    order.currency,
        name:        'Propellex',
        description: 'Pro Plan — ₹999/month',
        order_id:    order.order_id,
        prefill:     { name: user.name, email: user.email },
        theme:       { color: '#C9A84C' },
        handler: async (response) => {
          try {
            const result = await billing.verifyPayment({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            // Refresh user to get updated subscription_tier
            const refreshed = await auth.getProfile();
            updateUser(refreshed);
            setUpgradeSuccess(true);
            console.info('[Billing] Upgrade success:', result.message);
          } catch (e: unknown) {
            setUpgradeError((e as Error).message ?? 'Payment verification failed');
          } finally {
            setUpgrading(false);
          }
        },
        modal: {
          ondismiss: () => setUpgrading(false),
        },
      });

      rzp.open();
    } catch (e: unknown) {
      setUpgradeError((e as Error).message ?? 'Failed to initiate payment');
      setUpgrading(false);
    }
  };

  const isPremium = user.subscription_tier === 'premium' || user.subscription_tier === 'enterprise';
  const prefs = user.preferences;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-2xl font-headline font-bold text-on-surface">Profile</h1>

      {/* Account info */}
      <div className="bg-surface-container border border-outline-variant p-6 space-y-4">
        <h2 className="text-base font-headline font-semibold text-on-surface">Account</h2>

        <div>
          <label className="block text-xs text-on-surface-variant mb-1">Email</label>
          <p className="text-sm font-medium text-on-surface">{user.email}</p>
        </div>

        <div>
          <label className="block text-xs text-on-surface-variant mb-1">Display Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface-container-low border border-outline-variant text-on-surface focus:border-primary focus:outline-none px-3 py-2 text-sm w-full"
            />
            <Button size="sm" loading={saving} onClick={handleSaveName}>
              {saved ? 'Saved ✓' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Plan</label>
            <Badge variant={isPremium ? 'gold' : 'neutral'}>
              {user.subscription_tier ? user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1) : 'Free'}
            </Badge>
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Investor Type</label>
            <Badge variant="info">{user.user_type ? user.user_type.replace(/_/g, ' ').toUpperCase() : 'User'}</Badge>
          </div>
        </div>
      </div>

      {/* Upgrade to Premium */}
      {!isPremium && (
        <div className="bg-surface-container border border-primary/30 p-6 space-y-4">
          {upgradeSuccess ? (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <span className="material-symbols-outlined text-secondary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <p className="font-headline text-xl text-on-surface">You're now on Premium!</p>
              <p className="font-body text-sm text-on-surface-variant">Enjoy unlimited searches, chats, and portfolio saves.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      workspace_premium
                    </span>
                    <h2 className="font-headline text-base font-semibold text-on-surface">Upgrade to Premium</h2>
                  </div>
                  <p className="font-body text-sm text-on-surface-variant">
                    Unlock unlimited searches, AI chat queries, and portfolio saves.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-headline text-2xl text-primary">₹999</p>
                  <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">per month</p>
                </div>
              </div>

              {/* Feature list */}
              <ul className="space-y-2">
                {[
                  'Unlimited property searches',
                  'Unlimited AI chat queries',
                  'Unlimited portfolio saves',
                  'Priority support',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 font-body text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-secondary text-[16px]">check</span>
                    {f}
                  </li>
                ))}
              </ul>

              {upgradeError && (
                <p className="font-body text-xs text-error bg-error-container px-3 py-2">{upgradeError}</p>
              )}

              <button
                onClick={() => void handleUpgrade()}
                disabled={upgrading}
                className="w-full bg-primary text-on-primary font-label font-bold text-xs uppercase tracking-widest px-6 py-3 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {upgrading ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                    Upgrade — ₹999/mo
                  </>
                )}
              </button>

              <p className="text-[10px] font-label text-on-surface-variant text-center">
                Secure payment via Razorpay. Cancel anytime.
              </p>
            </>
          )}
        </div>
      )}

      {/* Investment preferences */}
      {prefs && Object.keys(prefs).length > 0 && (
        <div className="bg-surface-container border border-outline-variant p-6 space-y-4">
          <h2 className="text-base font-headline font-semibold text-on-surface">Investment Preferences</h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {(prefs.budget_min != null || prefs.budget_max != null) && (
              <div>
                <p className="text-xs text-on-surface-variant mb-0.5">Budget Range</p>
                <p className="font-medium text-on-surface">
                  {formatRupeesCr(prefs.budget_min ?? 0)} – {formatRupeesCr(prefs.budget_max ?? 0)}
                </p>
              </div>
            )}
            {prefs.roi_target != null && (
              <div>
                <p className="text-xs text-on-surface-variant mb-0.5">ROI Target</p>
                <p className="font-medium text-on-surface">{prefs.roi_target}% over 3 years</p>
              </div>
            )}
            {prefs.risk_appetite && (
              <div>
                <p className="text-xs text-on-surface-variant mb-0.5">Risk Appetite</p>
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
                <p className="text-xs text-on-surface-variant mb-0.5">Property Types</p>
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
              <p className="text-xs text-on-surface-variant mb-2">Preferred Localities</p>
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
