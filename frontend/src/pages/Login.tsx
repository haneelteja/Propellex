import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { OTPForm } from '@/components/auth/OTPForm';
import { Modal } from '@/components/shared/Modal';
import { PreferenceWizard } from '@/components/auth/PreferenceWizard';

type Step = 'email' | 'otp';

const FEATURE_POINTS = [
  'AI-powered property analysis across Hyderabad\'s premium localities',
  'Real-time portfolio valuation with paise-precision accuracy',
  'Exclusive access to off-market HNI listings in Jubilee Hills, Banjara Hills & beyond',
] as const;

export default function Login() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? '/';

  const handleOtpSent = (e: string) => {
    setEmail(e);
    setStep('otp');
  };

  const handleVerified = (isNewUser: boolean) => {
    if (isNewUser) {
      setShowWizard(true);
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel (desktop only) ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-container-low flex-col justify-between p-16 border-r border-outline-variant">
        <div className="text-2xl font-headline italic text-primary">Propellex</div>

        <div>
          <span className="text-primary font-label text-xs uppercase tracking-[0.2em] mb-4 block">
            Hyderabad Elite Portfolio
          </span>
          <h2 className="font-headline text-5xl font-light text-on-surface leading-tight mb-8">
            Intelligence <br />
            <span className="italic text-primary">Meets</span>
            <br /> Wealth.
          </h2>

          <div className="space-y-6">
            {FEATURE_POINTS.map((point) => (
              <div key={point} className="flex items-start gap-4">
                <span className="w-1.5 h-1.5 bg-primary mt-2 shrink-0"></span>
                <p className="text-on-surface-variant font-body text-sm">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">
          © 2024 Propellex. Curated for the Elite.
        </p>
      </div>

      {/* ── Right auth panel ──────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <span className="font-label text-xs text-primary uppercase tracking-[0.2em] mb-4 block">
            Secure Access
          </span>

          <h1 className="font-headline text-3xl font-light text-on-surface mb-2">
            {step === 'email' ? 'Welcome Back' : 'Verify Identity'}
          </h1>
          <p className="text-on-surface-variant font-body text-sm mb-10">
            {step === 'email'
              ? 'Enter your email to receive a secure OTP'
              : `Code sent to ${email}`}
          </p>

          {step === 'email' ? (
            <LoginForm onOtpSent={handleOtpSent} />
          ) : (
            <OTPForm
              email={email}
              onSuccess={handleVerified}
              onBack={() => setStep('email')}
            />
          )}

          <p className="text-center font-label text-[10px] text-on-surface-variant uppercase tracking-widest mt-10">
            By signing in you agree to our Terms of Service &amp; Privacy Policy.
          </p>
        </div>
      </div>

      {/* ── Onboarding wizard modal ───────────────────────────────────── */}
      <Modal
        open={showWizard}
        onClose={() => {}} // Cannot dismiss — wizard must be completed
        title="Set your investment preferences"
        className="max-w-md"
      >
        <PreferenceWizard onComplete={handleWizardComplete} />
      </Modal>
    </div>
  );
}
