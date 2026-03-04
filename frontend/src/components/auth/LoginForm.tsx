import { useState } from 'react';
import { Button } from '@/components/shared/Button';
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm"
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Send OTP
      </Button>

      <p className="text-xs text-gray-500 text-center">
        A 6-digit code will be sent to your email. Check your backend console in dev mode.
      </p>
    </form>
  );
}
