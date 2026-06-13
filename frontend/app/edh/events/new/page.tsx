'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import { ArrowLeft, Save, ImagePlus, X } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditor';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DEFAULT_LOCATION = 'Hidden Ridge, El Dorado Hills, CA';

export default function NewEventPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: DEFAULT_LOCATION,
    max_attendees: '',
  });
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [existingDates, setExistingDates] = useState<Date[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    eventsApi.list({ limit: 100, upcoming: false }).then(res => {
      const dates = (res.data.events || []).map((e: any) => new Date(e.start_date));
      setExistingDates(dates);
    }).catch(() => {});
  }, []);

  if (!isLoading && !isAdmin) {
    router.push('/');
    return null;
  }

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await eventsApi.uploadImage(file);
      setCoverImage(res.data.url);
    } catch {
      alert('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !startDate) return;
    const descText = form.description.replace(/<[^>]*>/g, '').trim();
    if (descText.length < 10) {
      alert('Description must be at least 10 characters');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        location: form.location || DEFAULT_LOCATION,
        start_date: startDate!.toISOString(),
        cover_image: coverImage ?? undefined,
      };
      if (endDate) payload.end_date = endDate.toISOString();
      if (form.max_attendees) payload.max_attendees = parseInt(form.max_attendees);
      await eventsApi.create(payload);
      router.push('/edh/events');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return null;

  const highlightEventDays = (date: Date) => {
    const isEvent = existingDates.some(
      d => d.getFullYear() === date.getFullYear() &&
           d.getMonth() === date.getMonth() &&
           d.getDate() === date.getDate()
    );
    return isEvent ? 'has-event' : '';
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 border-b border-forest-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/edh/events" className="flex items-center gap-2 text-forest-300 hover:text-gold-400 text-sm mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to Events
          </Link>
          <h1 className="font-serif text-2xl text-cream-100">Create Event</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="card p-8 space-y-6">

          {/* Cover photo */}
          <div>
            <label className="block font-sans text-sm text-forest-700 mb-2">Event Photo (optional)</label>
            {coverImage ? (
              <div className="relative w-full h-48 rounded-md overflow-hidden border border-cream-300">
                <img src={coverImage} alt="Event cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setCoverImage(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingImage}
                className="flex items-center gap-2 border-2 border-dashed border-cream-300 hover:border-gold-400 rounded-md px-5 py-4 text-sm text-forest-500 hover:text-gold-600 transition-colors w-full justify-center"
              >
                <ImagePlus size={16} />
                {uploadingImage ? 'Uploading…' : 'Upload event photo'}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImagePick} />
          </div>

          <div>
            <label className="block font-sans text-sm text-forest-700 mb-1">Event Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="input-field w-full"
              placeholder="Neighborhood Block Party"
              required
            />
          </div>

          <div>
            <label className="block font-sans text-sm text-forest-700 mb-1">Description</label>
            <RichTextEditor
              value={form.description}
              onChange={(val) => setForm({ ...form, description: val })}
              placeholder="Event details, schedule, what to bring..."
            />
          </div>

          <div>
            <label className="block font-sans text-sm text-forest-700 mb-1">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              onBlur={e => { if (!e.target.value.trim()) setForm(f => ({ ...f, location: DEFAULT_LOCATION })); }}
              className="input-field w-full"
              placeholder="e.g. Hidden Ridge Park, Grand Teton Dr"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-sm text-forest-700 mb-1">Start Date & Time</label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                showTimeSelect
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select start date & time"
                className="input-field w-full"
                wrapperClassName="w-full"
                dayClassName={highlightEventDays}
                required
              />
            </div>
            <div>
              <label className="block font-sans text-sm text-forest-700 mb-1">End Date & Time (optional)</label>
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                showTimeSelect
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select end date & time"
                minDate={startDate ?? undefined}
                className="input-field w-full"
                wrapperClassName="w-full"
                dayClassName={highlightEventDays}
              />
            </div>
          </div>

          <div className="max-w-xs">
            <label className="block font-sans text-sm text-forest-700 mb-1">Max Attendees (optional)</label>
            <input
              type="number"
              value={form.max_attendees}
              onChange={e => setForm({ ...form, max_attendees: e.target.value })}
              className="input-field w-full"
              placeholder="Leave blank for unlimited"
              min="1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-cream-200">
            <Link href="/edh/events" className="btn-secondary text-sm px-6 py-2">Cancel</Link>
            <button type="submit" disabled={saving} className="btn-gold text-sm px-6 py-2 flex items-center gap-2">
              <Save size={14} /> {saving ? 'Saving...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
