'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { eventsApi } from '@/lib/api';
import { Calendar, MapPin, Users, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/layout/PageHeader';

interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  event_date: string;
  end_date?: string;
  max_attendees?: number;
  rsvp_count?: number;
  cover_image?: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi.list({ upcoming: true })
      .then(res => setEvents(res.data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-cream-50">
      <PageHeader label="What's Happening" title="Events" />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-forest-400" size={32} />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="text-forest-300 mx-auto mb-4" size={48} />
            <p className="font-body text-forest-400 text-lg">No upcoming events. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="card p-6 flex flex-col sm:flex-row gap-6 group hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 w-20 text-center">
                  <div className="bg-forest-800 text-cream-100 rounded-sm py-3 px-4">
                    <div className="font-sans text-xs uppercase tracking-wider text-gold-400">
                      {format(new Date(event.event_date), 'MMM')}
                    </div>
                    <div className="font-serif text-2xl">
                      {format(new Date(event.event_date), 'd')}
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="font-serif text-xl text-forest-800 mb-2 group-hover:text-forest-600 transition-colors">{event.title}</h2>
                  {event.description && (
                    <p className="font-body text-forest-500 text-sm mb-3 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-forest-400 text-xs font-sans">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {format(new Date(event.event_date), 'h:mm a')}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {event.location}
                      </span>
                    )}
                    {event.max_attendees && (
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {event.rsvp_count || 0}/{event.max_attendees} spots
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
