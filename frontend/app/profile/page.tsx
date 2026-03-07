'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { membersApi, authApi } from '@/lib/api';
import Image from 'next/image';
import { Loader2, Save, Lock, Eye, EyeOff, ShieldCheck, ShieldOff, Copy, Check } from 'lucide-react';
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

      <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
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

        <ChangePasswordCard />
        <TwoFactorCard />
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.new_password !== pw.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (pw.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword({
        current_password: pw.current_password,
        new_password: pw.new_password,
      });
      toast.success('Password updated successfully');
      setPw({ current_password: '', new_password: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-8">
      <div className="flex items-center gap-3 mb-6">
        <Lock size={20} className="text-gold-500" />
        <h2 className="font-serif text-xl text-forest-800">Change Password</h2>
      </div>
      <form onSubmit={handleChangePassword} className="space-y-5">
        <div>
          <label className="section-label block mb-2">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={pw.current_password}
              onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
              className="input-field w-full pr-10"
              required
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-400 hover:text-forest-600">
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="section-label block mb-2">New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={pw.new_password}
              onChange={(e) => setPw({ ...pw, new_password: e.target.value })}
              className="input-field w-full pr-10"
              placeholder="Min. 8 characters"
              required
              minLength={8}
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-400 hover:text-forest-600">
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="section-label block mb-2">Confirm New Password</label>
          <input
            type="password"
            value={pw.confirm}
            onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            className="input-field w-full"
            required
            minLength={8}
          />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
          Update Password
        </button>
      </form>
    </div>
  );
}

function TwoFactorCard() {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'disable'>('idle');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [copied, setCopied] = useState(false);

  const isEnabled = user?.totp_enabled;

  const handleSetup = async () => {
    setLoading(true);
    try {
      const res = await authApi.setup2FA();
      setQrCode(res.data.qr_code);
      setSecret(res.data.secret);
      setBackupCodes(res.data.backup_codes);
      setStep('setup');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.enable2FA(code);
      toast.success('Two-factor authentication enabled!');
      setStep('idle');
      setCode('');
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.disable2FA(disablePassword);
      toast.success('Two-factor authentication disabled');
      setStep('idle');
      setDisablePassword('');
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card p-8">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck size={20} className="text-gold-500" />
        <h2 className="font-serif text-xl text-forest-800">Two-Factor Authentication</h2>
      </div>

      {step === 'idle' && (
        <>
          <p className="text-forest-500 text-sm font-sans mb-4">
            {isEnabled
              ? 'Two-factor authentication is currently enabled on your account.'
              : 'Add an extra layer of security by enabling two-factor authentication with an authenticator app.'}
          </p>
          {isEnabled ? (
            <button
              onClick={() => setStep('disable')}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <ShieldOff size={16} />
              Disable 2FA
            </button>
          ) : (
            <button
              onClick={handleSetup}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Enable 2FA
            </button>
          )}
        </>
      )}

      {step === 'setup' && (
        <div className="space-y-5">
          <p className="text-forest-500 text-sm font-sans">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
          </p>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
          </div>
          <div className="bg-cream-100 border border-forest-200 rounded-sm p-3">
            <p className="text-forest-400 text-xs font-sans mb-1">Manual entry key:</p>
            <p className="text-forest-800 text-sm font-mono break-all select-all">{secret}</p>
          </div>

          <div className="bg-gold-50 border border-gold-200 rounded-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-forest-800 text-sm font-sans font-semibold">Backup Codes</p>
              <button onClick={copyBackupCodes} className="text-forest-400 hover:text-forest-600">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-forest-500 text-xs font-sans mb-2">
              Save these codes in a safe place. Each can be used once if you lose your authenticator.
            </p>
            <div className="grid grid-cols-2 gap-1">
              {backupCodes.map((bc) => (
                <span key={bc} className="text-forest-700 text-xs font-mono bg-white px-2 py-1 rounded">{bc}</span>
              ))}
            </div>
          </div>

          <form onSubmit={handleEnable} className="space-y-4">
            <div>
              <label className="section-label block mb-2">Enter code from app to verify</label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
                className="input-field w-full text-center text-xl tracking-[0.3em] font-mono"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('idle')} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                Verify & Enable
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'disable' && (
        <form onSubmit={handleDisable} className="space-y-5">
          <p className="text-forest-500 text-sm font-sans">
            Enter your password to disable two-factor authentication.
          </p>
          <div>
            <label className="section-label block mb-2">Password</label>
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              className="input-field w-full"
              required
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setStep('idle'); setDisablePassword(''); }} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldOff size={16} />}
              Disable 2FA
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
