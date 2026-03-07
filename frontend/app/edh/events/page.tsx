'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import { Calendar, Plus, Edit, Trash2, MapPin, Users, Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  location: string;
  start_date: string;
  end_date?: string;
  attendee_count: number;
  max_attendees?: number;
}

export default function ManageEventsPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAdmin) router.push('/');
  }, [isLoading, isAdmin]);

  useEffect(() => {
    if (isAdmin) loadEvents();
  }, [isAdmin]);

  const loadEvents = async () => {
    try {
      const res = await eventsApi.list({ limit: 100, upcoming: false });
      setEvents(res.data.events || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete event "${title}"? This cannot be undone.`)) return;
    try {
      await eventsApi.delete(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch {
      alert('Failed to delete event');
    }
  };

  if (isLoading || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 border-b border-forest-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/edh" className="flex items-center gap-2 text-forest-300 hover:text-gold-400 text-sm mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="text-gold-400" size={24} />
              <h1 className="font-serif text-2xl text-cream-100">Manage Events</h1>
            </div>
            <Link href="/edh/events/new" className="btn-gold text-sm px-5 py-2 flex items-center gap-2">
              <Plus size={14} /> New Event
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-forest-400" size={32} /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="text-forest-300 mx-auto mb-4" size={48} />
            <p className="font-body text-forest-400 text-lg mb-4">No events yet</p>
            <Link href="/edh/events/new" className="btn-primary text-sm">Create Your First Event</Link>
          </div>
        ) : (
          <div className="card divide-y divide-cream-100">
            {events.map((event) => (
              <div key={event.id} className="p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-medium text-forest-800 text-sm mb-1">{event.title}</div>
                  <div className="flex items-center gap-4 text-xs text-forest-400 font-sans">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(event.start_date), 'MMM d, yyyy h:mm a')}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {event.attendee_count}{event.max_attendees ? `/${event.max_attendees}` : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/edh/events/${event.id}`} className="p-2 hover:bg-cream-100 rounded-sm transition-colors">
                    <Edit size={14} className="text-forest-500" />
                  </Link>
                  <button onClick={() => handleDelete(event.id, event.title)} className="p-2 hover:bg-red-50 rounded-sm transition-colors">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
