'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { eventsApi } from '@/lib/api';
import { Calendar, CalendarDays, List, MapPin, Users, Clock, Loader2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import PageHeader from '@/components/layout/PageHeader';
import EventCalendar from '@/components/EventCalendar';

interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start_date: string;
  end_date?: string;
  max_attendees?: number;
  attendee_count?: number;
  cover_image?: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = view === 'list' ? { upcoming: true } : { limit: 200 };
    eventsApi.list(params)
      .then(res => setEvents(res.data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [view]);

  // Events for the selected calendar date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((e) => isSameDay(new Date(e.start_date), selectedDate));
  }, [events, selectedDate]);

  return (
    <div className="min-h-screen bg-cream-50">
      <PageHeader label="What's Happening" title="Events" />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* View toggle */}
        <div className="flex justify-end mb-6 gap-2">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-sans transition-colors ${
              view === 'list' ? 'bg-forest-800 text-cream-100' : 'border border-forest-300 text-forest-600 hover:bg-cream-100'
            }`}
          >
            <List size={14} /> List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-sans transition-colors ${
              view === 'calendar' ? 'bg-forest-800 text-cream-100' : 'border border-forest-300 text-forest-600 hover:bg-cream-100'
            }`}
          >
            <CalendarDays size={14} /> Calendar
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-forest-400" size={32} />
          </div>
        ) : view === 'list' ? (
          /* ─── List View ──────────────────────────────────── */
          events.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="text-forest-300 mx-auto mb-4" size={48} />
              <p className="font-body text-forest-400 text-lg">No upcoming events. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )
        ) : (
          /* ─── Calendar View ──────────────────────────────── */
          <>
            <EventCalendar
              events={events}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />

            {/* Selected date events panel */}
            {selectedDate && (
              <div className="mt-8">
                <h3 className="font-serif text-lg text-forest-800 mb-4">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h3>
                {selectedDateEvents.length === 0 ? (
                  <p className="font-body text-forest-400 text-sm">No events on this day.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedDateEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Shared Event Card ──────────────────────────────────────── */
function EventCard({ event }: { event: Event }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="card p-6 flex flex-col sm:flex-row gap-6 group hover:shadow-md transition-shadow"
    >
      <div className="flex-shrink-0 w-20 text-center">
        <div className="bg-forest-800 text-cream-100 rounded-sm py-3 px-4">
          <div className="font-sans text-xs uppercase tracking-wider text-gold-400">
            {format(new Date(event.start_date), 'MMM')}
          </div>
          <div className="font-serif text-2xl">
            {format(new Date(event.start_date), 'd')}
          </div>
        </div>
      </div>
      <div className="flex-1">
        <h2 className="font-serif text-xl text-forest-800 mb-2 group-hover:text-forest-600 transition-colors">
          {event.title}
        </h2>
        {event.description && (
          <p className="font-body text-forest-500 text-sm mb-3 line-clamp-2">{event.description}</p>
        )}
        <div className="flex flex-wrap gap-4 text-forest-400 text-xs font-sans">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {format(new Date(event.start_date), 'h:mm a')}
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
              {event.attendee_count || 0}/{event.max_attendees} spots
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
