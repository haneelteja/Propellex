import { useState } from 'react';
import { Button } from '@/components/shared/Button';
import { auth } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface OTPFormProps {
  email: string;
  onSuccess: (isNewUser: boolean) => void;
  onBack: () => void;
}

export function OTPForm({ email, onSuccess, onBack }: OTPFormProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await auth.verifyOtp(email, code.trim());
      setAuth(token, user);
      const isNewUser = !user.name || !user.preferences?.localities?.length;
      onSuccess(isNewUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Enter the 6-digit code sent to <strong>{email}</strong>
        </p>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          OTP Code
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="123456"
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-center text-2xl tracking-widest font-mono"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Verify OTP
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-gray-500 hover:text-navy transition-colors"
      >
        ← Change email
      </button>
    </form>
  );
}
