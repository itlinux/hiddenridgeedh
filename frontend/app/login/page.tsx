'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getApiError } from '@/lib/api';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import Turnstile from '@/components/Turnstile';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { login, verify2FA } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  // 2FA state
  const [needs2FA, setNeeds2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      toast.success('Email verified! Your account is pending admin approval.');
    } else if (verified === 'already') {
      toast.info('Your email was already verified.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password, turnstileToken || undefined);
      if (result.requires_2fa && result.temp_token) {
        setNeeds2FA(true);
        setTempToken(result.temp_token);
        setLoading(false);
        setTimeout(() => codeInputRef.current?.focus(), 100);
        return;
      }
      toast.success('Welcome back!');
      const role = result.user?.role;
      router.push(role === 'super_admin' || role === 'content_admin' ? '/edh' : '/');
    } catch (err: any) {
      toast.error(getApiError(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verify2FA(tempToken, totpCode);
      toast.success('Welcome back!');
      // After 2FA, check role from localStorage since verify2FA doesn't return it
      const stored = localStorage.getItem('hr_user');
      const role = stored ? JSON.parse(stored).role : '';
      router.push(role === 'super_admin' || role === 'content_admin' ? '/edh' : '/');
    } catch (err: any) {
      toast.error(getApiError(err, 'Invalid code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-forest-800 flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #C9A84C 0, #C9A84C 1px, transparent 0, transparent 50%)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative text-center">
          <div className="w-16 h-16 bg-gold-400 flex items-center justify-center rounded-sm mx-auto mb-6">
            <span className="text-forest-800 font-serif font-bold text-2xl">HR</span>
          </div>
          <h2 className="font-serif text-4xl text-cream-100 mb-4">Hidden Ridge EDH</h2>
          <div className="w-12 h-px bg-gold-400 mx-auto mb-4" />
          <p className="text-forest-300 font-body text-lg">El Dorado Hills, California</p>
          <p className="text-forest-400 font-body text-sm mt-2">El Dorado Hills, California</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <div className="w-12 h-12 bg-forest-800 flex items-center justify-center rounded-sm mx-auto mb-4">
              <span className="text-gold-400 font-serif font-bold">HR</span>
            </div>
            <h1 className="font-serif text-2xl text-forest-800">Hidden Ridge EDH</h1>
          </div>

          {!needs2FA ? (
            <>
              <h2 className="font-serif text-3xl text-forest-800 mb-2">Welcome back</h2>
              <p className="font-body text-forest-500 text-sm mb-8">Sign in to your neighborhood account</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="section-label block mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="section-label block mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-400 hover:text-forest-600"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Turnstile onVerify={setTurnstileToken} />

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Signing In...</> : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="font-body text-forest-500 text-sm">
                  Not yet a member?{' '}
                  <Link href="/register" className="text-gold-500 hover:underline">Request access</Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck size={28} className="text-gold-500" />
                <h2 className="font-serif text-3xl text-forest-800">Two-Factor Authentication</h2>
              </div>
              <p className="font-body text-forest-500 text-sm mb-8">
                Enter the 6-digit code from your authenticator app, or a backup code.
              </p>

              <form onSubmit={handle2FAVerify} className="space-y-5">
                <div>
                  <label className="section-label block mb-2">Verification Code</label>
                  <input
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\s/g, ''))}
                    className="input-field text-center text-2xl tracking-[0.3em] font-mono"
                    placeholder="000000"
                    maxLength={8}
                    required
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : 'Verify & Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => { setNeeds2FA(false); setTotpCode(''); setTempToken(''); }}
                  className="font-body text-forest-500 text-sm hover:text-gold-500"
                >
                  Back to login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
