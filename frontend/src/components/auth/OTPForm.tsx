import { useState, useRef, useCallback } from 'react';
import { auth } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface OTPFormProps {
  email: string;
  onSuccess: (isNewUser: boolean) => void;
  onBack: () => void;
}

const OTP_LENGTH = 6;

export function OTPForm({ email, onSuccess, onBack }: OTPFormProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null));
  const setAuth = useAuthStore((s) => s.setAuth);

  const focusNext = useCallback((index: number) => {
    const next = inputRefs.current[index + 1];
    if (next) next.focus();
  }, []);

  const focusPrev = useCallback((index: number) => {
    const prev = inputRefs.current[index - 1];
    if (prev) prev.focus();
  }, []);

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');
    if (digit) focusNext(index);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index]) {
      focusPrev(index);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < OTP_LENGTH; i++) {
      next[i] = pasted[i] ?? '';
    }
    setDigits(next);
    const lastFilled = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastFilled]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = digits.join('');
    if (code.length !== OTP_LENGTH) {
      setError('Please fill in all 6 digits.');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await auth.verifyOtp(email, code);
      setAuth(token, user);
      const isNewUser = !user.name || !user.preferences?.localities?.length;
      onSuccess(isNewUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMessage('');
    setError('');
    setResending(true);
    try {
      await auth.sendOtp(email);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setResendMessage('A new code has been sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code. Try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* OTP digit boxes */}
      <div>
        <label className="block font-label text-xs text-on-surface-variant uppercase tracking-widest mb-4">
          Access Code
        </label>
        <div className="flex gap-3">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-xl font-headline bg-surface-container border border-outline-variant text-on-surface focus:border-primary focus:outline-none"
              autoFocus={index === 0}
            />
          ))}
        </div>
      </div>

      {error && (
        <p className="font-body text-sm text-error">{error}</p>
      )}
      {resendMessage && !error && (
        <p className="font-body text-sm text-secondary">{resendMessage}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-on-primary font-bold text-xs uppercase tracking-widest py-4 px-8 w-full hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Verifying...' : 'Verify & Enter'}
      </button>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="font-body text-xs text-on-surface-variant hover:text-on-surface transition-colors uppercase tracking-widest"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="font-body text-xs text-primary hover:text-primary-fixed transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resending ? 'Sending...' : 'Resend code'}
        </button>
      </div>
    </form>
  );
}
