'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import Turnstile from '@/components/Turnstile';

export default function RegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    address: '',
    phone: '',
  });

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({
        ...form,
        turnstile_token: turnstileToken || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="card p-10">
            <CheckCircle className="text-green-500 mx-auto mb-5" size={56} />
            <h1 className="font-serif text-3xl text-forest-800 mb-4">Registration Received</h1>
            <p className="font-body text-forest-500 leading-relaxed mb-2">
              Thank you for registering with Hidden Ridge EDH.
            </p>
            <p className="font-body text-forest-500 leading-relaxed mb-8">
              Your account is <strong>pending approval</strong> by a neighborhood administrator.
              You'll receive an email once your account has been approved.
            </p>
            <Link href="/" className="btn-gold text-sm px-8 py-3 inline-block">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <p className="text-forest-300 font-body text-lg">Join your neighbors</p>
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

          <h2 className="font-serif text-3xl text-forest-800 mb-2">Request Access</h2>
          <p className="font-body text-forest-500 text-sm mb-8">
            Register for a neighborhood account. An administrator will review and approve your request.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="section-label block mb-2">Full Name *</label>
              <input
                type="text"
                value={form.full_name}
                onChange={update('full_name')}
                className="input-field"
                placeholder="John Smith"
                required
              />
            </div>

            <div>
              <label className="section-label block mb-2">Email Address *</label>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                className="input-field"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="section-label block mb-2">Username *</label>
              <input
                type="text"
                value={form.username}
                onChange={update('username')}
                className="input-field"
                placeholder="johnsmith"
                required
              />
            </div>

            <div>
              <label className="section-label block mb-2">Password *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  className="input-field pr-10"
                  placeholder="Min. 8 characters"
                  minLength={8}
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

            <div>
              <label className="section-label block mb-2">Street Address</label>
              <input
                type="text"
                value={form.address}
                onChange={update('address')}
                className="input-field"
                placeholder="123 Grand Teton Dr"
              />
              <p className="text-forest-400 text-xs mt-1 font-sans">Helps verify neighborhood residency</p>
            </div>

            <div>
              <label className="section-label block mb-2">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={update('phone')}
                className="input-field"
                placeholder="(916) 555-0123"
              />
            </div>

            <Turnstile onVerify={setTurnstileToken} />

            {/* Privacy notice */}
            <div className="bg-cream-100 border border-cream-200 rounded-sm p-4">
              <p className="font-sans text-xs text-forest-600 leading-relaxed">
                <strong>Privacy Notice:</strong> By registering, you agree that all member information
                (including contact details, addresses, and directory data) is strictly for private
                neighborhood use only. You may not share, distribute, or sell member information
                to any business, third party, or commercial entity. Violation of this policy may
                result in account removal.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Request Access'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-body text-forest-500 text-sm">
              Already a member?{' '}
              <Link href="/login" className="text-gold-500 hover:underline">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
