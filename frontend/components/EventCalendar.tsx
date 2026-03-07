'use client';

import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  format,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start_date: string;
  location?: string;
  end_date?: string;
  max_attendees?: number;
  attendee_count?: number;
}

interface EventCalendarProps {
  events: CalendarEvent[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

const DAY_LABELS_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LABELS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function EventCalendar({ events, selectedDate, onDateSelect }: EventCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Build a map of date string -> events for O(1) lookups
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const key = format(new Date(event.start_date), 'yyyy-MM-dd');
      const existing = map.get(key) || [];
      existing.push(event);
      map.set(key, existing);
    });
    return map;
  }, [events]);

  // Get all days to display in the calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  return (
    <div className="card p-4 sm:p-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="p-2 rounded-sm hover:bg-cream-100 text-forest-400 hover:text-gold-500 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-serif text-xl sm:text-2xl text-forest-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-2 rounded-sm hover:bg-cream-100 text-forest-400 hover:text-gold-500 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS_FULL.map((label, i) => (
          <div
            key={label}
            className="text-center font-sans text-xs uppercase tracking-wider text-bark-400 py-2"
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{DAY_LABELS_SHORT[i]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-cream-200 rounded-sm overflow-hidden">
        {calendarDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate.get(dateKey) || [];
          const hasEvents = dayEvents.length > 0;
          const inCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);

          return (
            <button
              key={dateKey}
              onClick={() => onDateSelect(day)}
              className={`
                relative flex flex-col items-center py-2 sm:py-3 min-h-[48px] sm:min-h-[60px] transition-colors
                ${inCurrentMonth ? 'bg-white' : 'bg-cream-50'}
                ${isSelected ? 'bg-forest-800 text-cream-100' : inCurrentMonth ? 'hover:bg-cream-100' : ''}
                ${hasEvents && !isSelected ? 'cursor-pointer' : 'cursor-default'}
              `}
            >
              <span
                className={`
                  text-sm sm:text-base font-sans leading-none
                  ${isSelected ? 'text-cream-100 font-semibold' : ''}
                  ${!isSelected && today ? 'text-gold-600 font-bold' : ''}
                  ${!isSelected && !today && inCurrentMonth ? 'text-forest-700' : ''}
                  ${!isSelected && !today && !inCurrentMonth ? 'text-forest-200' : ''}
                `}
              >
                {format(day, 'd')}
              </span>

              {/* Today ring indicator */}
              {today && !isSelected && (
                <div className="absolute inset-1 sm:inset-1.5 rounded-sm ring-2 ring-gold-400 pointer-events-none" />
              )}

              {/* Event dots */}
              {hasEvents && (
                <div className="flex gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-gold-400' : 'bg-gold-500'
                      }`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span
                      className={`text-[8px] leading-none ${
                        isSelected ? 'text-gold-400' : 'text-gold-500'
                      }`}
                    >
                      +
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
