import { useState } from 'react';
import { auth } from '@/services/api';

interface LoginFormProps {
  onOtpSent: (email: string) => void;
}

export function LoginForm({ onOtpSent }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await auth.sendOtp(email.trim().toLowerCase());
      onOtpSent(email.trim().toLowerCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block font-label text-xs text-on-surface-variant uppercase tracking-widest mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="bg-surface-container border border-outline-variant text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none px-4 py-3 w-full font-body text-sm"
        />
      </div>

      {error && (
        <p className="font-body text-sm text-error">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-on-primary font-bold text-xs uppercase tracking-widest py-4 px-8 w-full hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending...' : 'Request Access Code'}
      </button>

      <p className="font-body text-xs text-on-surface-variant text-center">
        New to Propellex?{' '}
        <span className="text-primary">Access is free.</span>
      </p>
    </form>
  );
}
