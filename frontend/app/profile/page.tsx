'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { membersApi } from '@/lib/api';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    bio: '',
    address: '',
    phone: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      setForm({
        full_name: user.full_name || '',
        username: user.username || '',
        bio: '',
        address: '',
        phone: '',
        latitude: user.latitude?.toString() || '',
        longitude: user.longitude?.toString() || '',
      });
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      };
      await membersApi.updateMe(payload);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-cream-50 flex items-center justify-center"><Loader2 className="animate-spin text-forest-400" size={32} /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="section-label text-gold-400 mb-3">Your Account</p>
          <h1 className="font-serif text-4xl text-cream-100">My Profile</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-forest-100 border-2 border-forest-200 rounded-full flex items-center justify-center mx-auto mb-4">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-forest-600 font-serif font-bold text-2xl">
                  {user.full_name.charAt(0)}
                </span>
              )}
            </div>
            <p className="text-forest-400 text-sm font-sans">{user.email}</p>
            <span className="inline-block bg-forest-100 text-forest-600 text-xs font-sans px-3 py-1 rounded-sm uppercase tracking-wider mt-2">
              {user.role.replace('_', ' ')}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="section-label block mb-2">Full Name</label>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="section-label block mb-2">Username</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="section-label block mb-2">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="input-field w-full h-24 resize-none"
                placeholder="Tell your neighbors about yourself..."
              />
            </div>
            <div>
              <label className="section-label block mb-2">Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="section-label block mb-2">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="section-label block mb-2">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  className="input-field w-full"
                  placeholder="38.683"
                />
              </div>
              <div>
                <label className="section-label block mb-2">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  className="input-field w-full"
                  placeholder="-121.076"
                />
              </div>
            </div>
            <p className="text-forest-400 text-xs font-sans -mt-3">
              Set your coordinates to appear on the neighborhood map. Find yours on Google Maps.
            </p>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
