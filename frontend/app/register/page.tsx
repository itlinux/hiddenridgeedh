'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    email: '',
    username: '',
    full_name: '',
    address: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({
        email: form.email,
        username: form.username,
        full_name: form.full_name,
        address: form.address,
        phone: form.phone,
        password: form.password,
      });
      setSubmitted(true);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <CheckCircle size={64} className="text-forest-600 mx-auto mb-6" />
          <h2 className="font-serif text-3xl text-forest-800 mb-4">Registration Submitted</h2>
          <div className="divider-gold" />
          <p className="font-body text-forest-500 mt-6 leading-relaxed">
            Thank you for registering! Your account is pending approval by a community administrator. You'll receive an email at <strong>{form.email}</strong> once you're approved — typically within 24–48 hours.
          </p>
          <Link href="/" className="btn-primary inline-flex mt-8">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 py-16 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <p className="section-label text-bark-400">Residents Only</p>
          <h1 className="font-serif text-4xl text-forest-800 mt-3">Join Hidden Ridge EDH</h1>
          <div className="divider-gold" />
          <p className="font-body text-forest-500 text-sm mt-4">
            All registrations are reviewed and approved by community admins.
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="section-label block mb-2">Full Name *</label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Jane Smith"
                  required
                />
              </div>
              <div>
                <label className="section-label block mb-2">Username *</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="jsmith"
                  required
                  minLength={3}
                />
              </div>
            </div>

            <div>
              <label className="section-label block mb-2">Email Address *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="section-label block mb-2">Neighborhood Address</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="input-field"
                placeholder="123 Ridge View Dr"
              />
              <p className="text-xs text-forest-400 mt-1 font-sans">Helps verify you're a Hidden Ridge resident</p>
            </div>

            <div>
              <label className="section-label block mb-2">Phone (optional)</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="(916) 555-0100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="section-label block mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="section-label block mb-2">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Repeat password"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Request Membership'}
            </button>
          </form>
        </div>

        <p className="text-center font-body text-forest-500 text-sm mt-6">
          Already a member?{' '}
          <Link href="/login" className="text-gold-500 hover:underline">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
