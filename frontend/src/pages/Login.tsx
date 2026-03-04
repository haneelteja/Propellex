import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { OTPForm } from '@/components/auth/OTPForm';
import { Modal } from '@/components/shared/Modal';
import { PreferenceWizard } from '@/components/auth/PreferenceWizard';

type Step = 'email' | 'otp';

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
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center">
              <span className="text-gold font-bold text-xl">P</span>
            </div>
            <span className="text-3xl font-bold text-navy">Propellex</span>
          </div>
          <p className="text-gray-500 text-sm">AI-powered real estate intelligence for HNIs</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-xl font-semibold text-navy mb-1">
            {step === 'email' ? 'Welcome back' : 'Verify your identity'}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {step === 'email'
              ? 'Sign in with your email address'
              : 'Enter the OTP sent to your email'}
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
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By signing in you agree to our Terms of Service & Privacy Policy.
        </p>
      </div>

      {/* Onboarding wizard modal */}
      <Modal
        open={showWizard}
        onClose={() => {}} // Can't dismiss — must complete wizard
        title="Set your investment preferences"
        className="max-w-md"
      >
        <PreferenceWizard onComplete={handleWizardComplete} />
      </Modal>
    </div>
  );
}
