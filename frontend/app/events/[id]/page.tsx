'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { eventsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  description?: string;
  content?: string;
  location?: string;
  event_date: string;
  end_date?: string;
  max_attendees?: number;
  rsvp_count?: number;
  rsvps?: string[];
  cover_image?: string;
  created_by_name?: string;
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    if (id) {
      eventsApi.get(id)
        .then(res => setEvent(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleRsvp = async () => {
    if (!user || !event) return;
    setRsvpLoading(true);
    try {
      await eventsApi.rsvp(event.id);
      const res = await eventsApi.get(event.id);
      setEvent(res.data);
      toast.success('RSVP updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'RSVP failed');
    } finally {
      setRsvpLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-cream-50 flex items-center justify-center"><Loader2 className="animate-spin text-forest-400" size={32} /></div>;
  if (!event) return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="font-serif text-2xl text-forest-800 mb-4">Event not found</h2>
        <Link href="/events" className="text-gold-500 hover:underline font-sans text-sm">Back to events</Link>
      </div>
    </div>
  );

  const hasRsvpd = user && event.rsvps?.includes(user.id);

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/events" className="flex items-center gap-2 text-forest-400 hover:text-gold-500 font-sans text-sm mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to events
        </Link>

        <h1 className="font-serif text-4xl text-forest-800 mb-4">{event.title}</h1>

        <div className="flex flex-wrap gap-6 text-forest-500 text-sm font-sans mb-8">
          <span className="flex items-center gap-2">
            <Calendar size={14} className="text-gold-500" />
            {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
          </span>
          <span className="flex items-center gap-2">
            <Clock size={14} className="text-gold-500" />
            {format(new Date(event.event_date), 'h:mm a')}
          </span>
          {event.location && (
            <span className="flex items-center gap-2">
              <MapPin size={14} className="text-gold-500" />
              {event.location}
            </span>
          )}
          {event.max_attendees && (
            <span className="flex items-center gap-2">
              <Users size={14} className="text-gold-500" />
              {event.rsvp_count || 0}/{event.max_attendees} attending
            </span>
          )}
        </div>

        {user && (
          <button onClick={handleRsvp} disabled={rsvpLoading} className={`${hasRsvpd ? 'btn-secondary' : 'btn-primary'} mb-8`}>
            {rsvpLoading ? <Loader2 size={14} className="animate-spin" /> : hasRsvpd ? 'Cancel RSVP' : 'RSVP'}
          </button>
        )}

        {event.cover_image && <img src={event.cover_image} alt="" className="w-full rounded-sm mb-8" />}

        <div className="prose-ridge font-body text-forest-700 leading-relaxed">
          {event.content ? (
            <div dangerouslySetInnerHTML={{ __html: event.content }} />
          ) : event.description ? (
            <p>{event.description}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
