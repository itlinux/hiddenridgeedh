'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { membersApi, authApi } from '@/lib/api';
import {
  Loader2, Save, Lock, Eye, EyeOff, ShieldCheck, ShieldOff, Copy, Check,
  Camera, Home, Dog, GraduationCap, Users, Plus, Trash2, Upload, X, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';

export default function ProfilePage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    bio: '',
    address: '',
    phone: '',
    school: '',
    alt_phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    has_dog: false,
    dog_friendly: false,
    dog_bio: '',
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
        bio: user.bio || '',
        address: user.address || '',
        phone: user.phone || '',
        school: user.school || '',
        alt_phone: user.alt_phone || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
        has_dog: user.has_dog || false,
        dog_friendly: user.dog_friendly || false,
        dog_bio: user.dog_bio || '',
        latitude: user.latitude?.toString() || '',
        longitude: user.longitude?.toString() || '',
      });
      setSmsOptIn(user.sms_opt_in || false);
      setEmailOptIn(user.email_opt_in || false);
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        sms_opt_in: smsOptIn,
        email_opt_in: emailOptIn,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      };
      await membersApi.updateMe(payload);
      await refreshUser();
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
      <PageHeader label="Your Account" title="My Profile" />

      <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
        <div className="card p-8">
          <div className="text-center mb-8">
            <AvatarUpload user={user} onUpdated={refreshUser} />
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
            <div>
              <label className="section-label block mb-2">Alternative Phone</label>
              <input
                value={form.alt_phone}
                onChange={(e) => setForm({ ...form, alt_phone: e.target.value })}
                className="input-field w-full"
                placeholder="e.g. work or cell"
              />
            </div>

            {/* Emergency Contact */}
            <div className="bg-cream-100 rounded-sm p-4 space-y-3">
              <p className="section-label text-xs mb-1">Emergency Contact</p>
              <div>
                <label className="section-label text-xs block mb-1">Name</label>
                <input
                  value={form.emergency_contact_name}
                  onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
                  className="input-field w-full"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div>
                <label className="section-label text-xs block mb-1">Phone</label>
                <input
                  value={form.emergency_contact_phone}
                  onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
                  className="input-field w-full"
                  placeholder="e.g. (916) 555-0100"
                />
              </div>
            </div>

            {/* School */}
            <div>
              <label className="section-label block mb-2 flex items-center gap-2">
                <GraduationCap size={14} className="text-gold-500" /> Kids&apos; School
              </label>
              <input
                value={form.school}
                onChange={(e) => setForm({ ...form, school: e.target.value })}
                className="input-field w-full"
                placeholder="e.g. Oak Ridge Elementary"
              />
            </div>

            {/* Dog Info */}
            <div className="bg-cream-100 rounded-sm p-4 space-y-3">
              <p className="section-label text-xs mb-1 flex items-center gap-2">
                <Dog size={14} className="text-gold-500" /> Dog Info
              </p>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="has_dog"
                  checked={form.has_dog}
                  onChange={(e) => setForm({ ...form, has_dog: e.target.checked, dog_friendly: e.target.checked ? form.dog_friendly : false })}
                  className="mt-1 h-4 w-4 rounded border-forest-300 text-gold-500 focus:ring-gold-400"
                />
                <label htmlFor="has_dog" className="text-forest-600 font-sans text-sm leading-relaxed cursor-pointer">
                  I have a dog
                </label>
              </div>
              {form.has_dog && (
                <>
                  <div className="flex items-start gap-3 ml-7">
                    <input
                      type="checkbox"
                      id="dog_friendly"
                      checked={form.dog_friendly}
                      onChange={(e) => setForm({ ...form, dog_friendly: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-forest-300 text-gold-500 focus:ring-gold-400"
                    />
                    <label htmlFor="dog_friendly" className="text-forest-600 font-sans text-sm leading-relaxed cursor-pointer">
                      My dog is friendly
                    </label>
                  </div>
                  <DogPhotoUpload user={user} onUpdated={refreshUser} />
                  <div>
                    <label className="section-label text-xs block mb-1">About my dog</label>
                    <textarea
                      value={form.dog_bio}
                      onChange={(e) => setForm({ ...form, dog_bio: e.target.value })}
                      rows={3}
                      maxLength={500}
                      className="input-field w-full resize-none"
                      placeholder="e.g. Friendly with other dogs, loves kids, name is Buddy..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* Alert Notifications */}
            <div className="bg-cream-100 rounded-sm p-4 space-y-3">
              <p className="section-label text-xs mb-1">Alert Notifications</p>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="sms_opt_in_profile"
                  checked={smsOptIn}
                  onChange={(e) => setSmsOptIn(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-forest-300 text-gold-500 focus:ring-gold-400"
                />
                <label htmlFor="sms_opt_in_profile" className="text-forest-600 font-sans text-sm leading-relaxed cursor-pointer">
                  Receive <strong>SMS notifications</strong> — text alerts to the neighborhood number and receive them via text.
                </label>
              </div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="email_opt_in_profile"
                  checked={emailOptIn}
                  onChange={(e) => setEmailOptIn(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-forest-300 text-gold-500 focus:ring-gold-400"
                />
                <label htmlFor="email_opt_in_profile" className="text-forest-600 font-sans text-sm leading-relaxed cursor-pointer">
                  Receive <strong>email notifications</strong> when a neighborhood alert is posted.
                </label>
              </div>
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

        <HousePhotoCard user={user} onUpdated={refreshUser} />
        <FamilyMembersCard user={user} onUpdated={refreshUser} />
        <ChangePasswordCard />
        <TwoFactorCard />
      </div>
    </div>
  );
}

// ── Avatar Upload ───────────────────────────────────────────────
function AvatarUpload({ user, onUpdated }: { user: any; onUpdated: () => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await membersApi.uploadAvatar(fd);
      await onUpdated();
      toast.success('Avatar updated');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await membersApi.deleteAvatar();
      await onUpdated();
      toast.success('Avatar removed');
    } catch (err: any) {
      toast.error('Failed to remove avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-4">
      <div
        className="w-20 h-20 bg-forest-100 border-2 border-forest-200 rounded-full flex items-center justify-center mx-auto relative cursor-pointer group overflow-hidden"
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <Loader2 size={24} className="animate-spin text-forest-400" />
        ) : user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-forest-600 font-serif font-bold text-2xl">
            {user.full_name.charAt(0)}
          </span>
        )}
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera size={18} className="text-white" />
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {user.avatar_url && (
        <button onClick={handleRemove} className="text-forest-400 hover:text-red-500 text-xs font-sans mt-1 block mx-auto">
          Remove photo
        </button>
      )}
    </div>
  );
}

// ── House Photo Card ────────────────────────────────────────────
function HousePhotoCard({ user, onUpdated }: { user: any; onUpdated: () => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await membersApi.uploadHousePhoto(fd);
      await onUpdated();
      toast.success('House photo updated');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await membersApi.deleteHousePhoto();
      await onUpdated();
      toast.success('House photo removed');
    } catch (err: any) {
      toast.error('Failed to remove house photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card p-8">
      <div className="flex items-center gap-3 mb-6">
        <Home size={20} className="text-gold-500" />
        <h2 className="font-serif text-xl text-forest-800">House Photo</h2>
      </div>
      <p className="text-forest-500 text-sm font-sans mb-4">
        Upload a photo of your house so neighbors can recognize it.
      </p>

      {user.house_photo_url ? (
        <div className="relative">
          <img
            src={user.house_photo_url}
            alt="House"
            className="w-full h-48 object-cover rounded-sm border border-cream-200"
          />
          <button
            onClick={handleRemove}
            disabled={uploading}
            className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-forest-600 hover:text-red-500 rounded-full p-1.5 shadow-sm transition-colors"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full h-32 border-2 border-dashed border-forest-200 rounded-sm flex flex-col items-center justify-center gap-2 text-forest-400 hover:border-gold-400 hover:text-gold-500 transition-colors"
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              <Upload size={24} />
              <span className="text-sm font-sans">Click to upload</span>
            </>
          )}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {user.house_photo_url && (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-gold-500 hover:text-gold-600 text-sm font-sans mt-3 flex items-center gap-1"
        >
          <Camera size={14} /> Change photo
        </button>
      )}
    </div>
  );
}

// ── Dog Photo Upload (inline in dog section) ────────────────────
function DogPhotoUpload({ user, onUpdated }: { user: any; onUpdated: () => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await membersApi.uploadDogPhoto(fd);
      await onUpdated();
      toast.success('Dog photo updated');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await membersApi.deleteDogPhoto();
      await onUpdated();
      toast.success('Dog photo removed');
    } catch (err: any) {
      toast.error('Failed to remove dog photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="ml-7 mt-2">
      {user.dog_photo_url ? (
        <div className="relative inline-block">
          <img
            src={user.dog_photo_url}
            alt="Dog"
            className="w-20 h-20 object-cover rounded-sm border border-forest-200"
          />
          <button
            onClick={handleRemove}
            disabled={uploading}
            className="absolute -top-1.5 -right-1.5 bg-white hover:bg-red-50 text-forest-500 hover:text-red-500 rounded-full p-0.5 shadow-sm border border-cream-200 transition-colors"
          >
            {uploading ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-gold-500 hover:text-gold-600 text-xs font-sans mt-1 flex items-center gap-1"
          >
            <Camera size={10} /> Change
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-20 h-20 border-2 border-dashed border-forest-200 rounded-sm flex flex-col items-center justify-center gap-1 text-forest-400 hover:border-gold-400 hover:text-gold-500 transition-colors"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Camera size={16} />
              <span className="text-[10px] font-sans">Dog photo</span>
            </>
          )}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Family Members Card ─────────────────────────────────────────
interface FamilyMember {
  name: string;
  bio?: string;
  photo_url?: string;
}

function FamilyMembersCard({ user, onUpdated }: { user: any; onUpdated: () => Promise<void> }) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(user.family_members || []);
  const [adding, setAdding] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formBio, setFormBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFamilyMembers(user.family_members || []);
  }, [user.family_members]);

  const handleAdd = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const res = await membersApi.addFamily({ name: formName.trim(), bio: formBio.trim() || undefined });
      setFamilyMembers(res.data.family_members);
      await onUpdated();
      setAdding(false);
      setFormName('');
      setFormBio('');
      toast.success('Family member added');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (index: number) => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const res = await membersApi.updateFamily(index, { name: formName.trim(), bio: formBio.trim() || undefined });
      setFamilyMembers(res.data.family_members);
      await onUpdated();
      setEditIndex(null);
      setFormName('');
      setFormBio('');
      toast.success('Family member updated');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (index: number) => {
    setSaving(true);
    try {
      const res = await membersApi.deleteFamily(index);
      setFamilyMembers(res.data.family_members);
      await onUpdated();
      toast.success('Family member removed');
    } catch (err: any) {
      toast.error('Failed to remove');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (index: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await membersApi.uploadFamilyPhoto(index, fd);
      setFamilyMembers(res.data.family_members);
      await onUpdated();
      toast.success('Photo updated');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    }
  };

  const handlePhotoRemove = async (index: number) => {
    try {
      const res = await membersApi.deleteFamilyPhoto(index);
      setFamilyMembers(res.data.family_members);
      await onUpdated();
      toast.success('Photo removed');
    } catch (err: any) {
      toast.error('Failed to remove photo');
    }
  };

  const startEdit = (index: number) => {
    setEditIndex(index);
    setFormName(familyMembers[index].name);
    setFormBio(familyMembers[index].bio || '');
    setAdding(false);
  };

  const startAdd = () => {
    setAdding(true);
    setEditIndex(null);
    setFormName('');
    setFormBio('');
  };

  const cancelForm = () => {
    setAdding(false);
    setEditIndex(null);
    setFormName('');
    setFormBio('');
  };

  return (
    <div className="card p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={20} className="text-gold-500" />
          <h2 className="font-serif text-xl text-forest-800">Family Members</h2>
        </div>
        {!adding && editIndex === null && familyMembers.length < 10 && (
          <button onClick={startAdd} className="text-gold-500 hover:text-gold-600 text-sm font-sans flex items-center gap-1">
            <Plus size={14} /> Add
          </button>
        )}
      </div>

      {familyMembers.length === 0 && !adding && (
        <p className="text-forest-400 text-sm font-sans text-center py-4">
          No family members added yet. Add your household members so neighbors can get to know your family.
        </p>
      )}

      <div className="space-y-4">
        {familyMembers.map((fm, i) => (
          <div key={i} className="flex items-start gap-4 p-3 bg-cream-50 rounded-sm">
            <FamilyPhotoUpload
              photoUrl={fm.photo_url}
              name={fm.name}
              onUpload={(file) => handlePhotoUpload(i, file)}
              onRemove={() => handlePhotoRemove(i)}
            />
            {editIndex === i ? (
              <div className="flex-1 space-y-2">
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input-field w-full text-sm"
                  placeholder="Name"
                />
                <textarea
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  className="input-field w-full text-sm h-16 resize-none"
                  placeholder="Short bio (optional)"
                />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(i)} disabled={saving} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                  </button>
                  <button onClick={cancelForm} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <p className="font-sans text-forest-800 font-medium text-sm">{fm.name}</p>
                {fm.bio && <p className="font-body text-forest-500 text-xs mt-1">{fm.bio}</p>}
              </div>
            )}
            {editIndex !== i && (
              <div className="flex gap-1">
                <button onClick={() => startEdit(i)} className="text-forest-400 hover:text-gold-500 p-1">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(i)} disabled={saving} className="text-forest-400 hover:text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}

        {adding && (
          <div className="p-3 bg-cream-50 rounded-sm space-y-2">
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="input-field w-full text-sm"
              placeholder="Name"
              autoFocus
            />
            <textarea
              value={formBio}
              onChange={(e) => setFormBio(e.target.value)}
              className="input-field w-full text-sm h-16 resize-none"
              placeholder="Short bio (optional)"
            />
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={saving || !formName.trim()} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
              </button>
              <button onClick={cancelForm} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Family Photo Upload ─────────────────────────────────────────
function FamilyPhotoUpload({
  photoUrl, name, onUpload, onRemove,
}: {
  photoUrl?: string | null;
  name: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <div
        className="w-12 h-12 bg-forest-100 border border-forest-200 rounded-full flex items-center justify-center cursor-pointer group overflow-hidden flex-shrink-0"
        onClick={() => fileRef.current?.click()}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-forest-500 font-serif font-bold text-sm">
            {name.charAt(0)}
          </span>
        )}
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera size={12} className="text-white" />
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          if (fileRef.current) fileRef.current.value = '';
        }}
      />
    </div>
  );
}

// ── Change Password Card ────────────────────────────────────────
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

// ── Two-Factor Card ─────────────────────────────────────────────
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
            <>
              <button
                onClick={handleSetup}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                Enable 2FA
              </button>
              <div className="mt-4 pt-4 border-t border-cream-200">
                <p className="text-forest-400 text-xs font-sans mb-2">Need an authenticator app?</p>
                <div className="flex gap-3">
                  <a href="https://apps.apple.com/app/google-authenticator/id388497605" target="_blank" rel="noopener noreferrer" className="text-gold-500 text-xs font-sans hover:underline">
                    iPhone (App Store)
                  </a>
                  <span className="text-forest-300">|</span>
                  <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noopener noreferrer" className="text-gold-500 text-xs font-sans hover:underline">
                    Android (Play Store)
                  </a>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {step === 'setup' && (
        <div className="space-y-5">
          <p className="text-forest-500 text-sm font-sans">
            Scan this QR code with your authenticator app. Don&apos;t have one? Download Google Authenticator for{' '}
            <a href="https://apps.apple.com/app/google-authenticator/id388497605" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">iPhone</a>
            {' '}or{' '}
            <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">Android</a>.
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
