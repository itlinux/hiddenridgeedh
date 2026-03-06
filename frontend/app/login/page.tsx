'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Login failed. Please try again.';
      toast.error(msg);
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

          <h2 className="font-serif text-3xl text-forest-800 mb-2">Welcome back</h2>
          <p className="font-body text-forest-500 text-sm mb-8">Sign in to your community account</p>

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
        </div>
      </div>
    </div>
  );
}
