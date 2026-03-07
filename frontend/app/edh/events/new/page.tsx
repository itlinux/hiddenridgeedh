'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditor';

export default function NewEventPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    max_attendees: '',
  });

  if (!isLoading && !isAdmin) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_date) return;
    // Validate description has content (strip HTML tags)
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
        location: form.location,
        start_date: new Date(form.start_date).toISOString(),
      };
      if (form.end_date) payload.end_date = new Date(form.end_date).toISOString();
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
              className="input-field w-full"
              placeholder="Hidden Ridge Park, Grand Teton Dr"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-sm text-forest-700 mb-1">Start Date & Time</label>
              <input
                type="datetime-local"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
                className="input-field w-full"
                required
              />
            </div>
            <div>
              <label className="block font-sans text-sm text-forest-700 mb-1">End Date & Time (optional)</label>
              <input
                type="datetime-local"
                value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })}
                className="input-field w-full"
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
