'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DEFAULT_LOCATION = 'Hidden Ridge, El Dorado Hills, CA';

export default function SubmitEventPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', location: DEFAULT_LOCATION, max_attendees: '' });
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  if (!isLoading && !user) { router.push('/login'); return null; }
  if (!isLoading && user?.role === 'pending') return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center">
      <p className="font-body text-forest-500">Your account is pending approval. You'll be able to submit events once approved.</p>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!startDate) { setError('Start date & time is required.'); return; }
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description || ' ',
        location: form.location || DEFAULT_LOCATION,
        start_date: startDate.toISOString(),
        status: 'pending_approval',
      };
      if (endDate) payload.end_date = endDate.toISOString();
      if (form.max_attendees) payload.max_attendees = parseInt(form.max_attendees);
      await eventsApi.submit(payload);
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit event.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return null;

  if (done) return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="card p-10 text-center max-w-md">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="font-serif text-2xl text-forest-800 mb-3">Event Submitted!</h2>
        <p className="font-body text-forest-500 mb-6">Your event has been submitted for admin review. You'll be notified once it's approved and published.</p>
        <Link href="/events" className="btn-primary text-sm px-6 py-2">Back to Events</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 border-b border-forest-700">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Link href="/events" className="flex items-center gap-2 text-forest-300 hover:text-gold-400 text-sm mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to Events
          </Link>
          <h1 className="font-serif text-2xl text-cream-100">Submit an Event</h1>
          <p className="text-forest-300 text-sm font-sans mt-1">Your submission will be reviewed by an admin before publishing.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          <div>
            <label className="block font-sans text-sm text-forest-700 mb-1">Event Title *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="input-field w-full" placeholder="Neighborhood Block Party" />
          </div>

          <div>
            <label className="block font-sans text-sm text-forest-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="input-field w-full" rows={4} placeholder="Event details, what to bring, contact info..." />
          </div>

          <div>
            <label className="block font-sans text-sm text-forest-700 mb-1">Location</label>
            <input type="text" value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              onBlur={e => { if (!e.target.value.trim()) setForm(f => ({ ...f, location: DEFAULT_LOCATION })); }}
              className="input-field w-full" placeholder={DEFAULT_LOCATION} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-sm text-forest-700 mb-1">Start Date & Time *</label>
              <DatePicker selected={startDate} onChange={(d: Date | null) => setStartDate(d)}
                showTimeSelect timeIntervals={15} dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select start" className="input-field w-full" wrapperClassName="w-full" />
            </div>
            <div>
              <label className="block font-sans text-sm text-forest-700 mb-1">End Date & Time (optional)</label>
              <DatePicker selected={endDate} onChange={(d: Date | null) => setEndDate(d)}
                showTimeSelect timeIntervals={15} dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select end" minDate={startDate ?? undefined}
                className="input-field w-full" wrapperClassName="w-full" />
            </div>
          </div>

          <div className="max-w-xs">
            <label className="block font-sans text-sm text-forest-700 mb-1">Max Attendees (optional)</label>
            <input type="number" value={form.max_attendees} onChange={e => setForm({ ...form, max_attendees: e.target.value })}
              className="input-field w-full" placeholder="Leave blank for unlimited" min="1" />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-sm px-4 py-3 text-sm font-sans">{error}</div>}

          <div className="flex justify-end gap-3 pt-4 border-t border-cream-200">
            <Link href="/events" className="btn-secondary text-sm px-6 py-2">Cancel</Link>
            <button type="submit" disabled={saving} className="btn-gold text-sm px-6 py-2 flex items-center gap-2">
              <Send size={14} /> {saving ? 'Submitting…' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
