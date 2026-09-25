import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, isToday, addDays, differenceInDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle, Badge, Modal, Skeleton } from '../components/ui';
import {
  ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, ClockIcon,
  AcademicCapIcon, CheckCircleIcon, DocumentTextIcon, PlusIcon,
  SunIcon, MoonIcon, Squares2X2Icon, ListBulletIcon
} from '@heroicons/react/24/outline';
import { toast } from '../components/ui/Toast';

type ViewMode = 'month' | 'week' | 'day';

interface CalendarEvent {
  id: string;
  type: 'exam' | 'task' | 'study-block' | 'session';
  title: string;
  subject?: string;
  subjectColor?: string;
  date: string;
  startTime?: string;
  duration?: number;
  priority?: string;
  completed?: boolean;
  sessionType?: string;
}

export function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([]);
  const [dayModalOpen, setDayModalOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const start = viewMode === 'month' ? startOfMonth(currentDate) : viewMode === 'week' ? startOfWeek(currentDate) : currentDate;
      const end = viewMode === 'month' ? endOfMonth(currentDate) : viewMode === 'week' ? endOfWeek(currentDate) : currentDate;

      const res = await api.get('/api/calendar', {
        params: { start: start.toISOString(), end: end.toISOString() }
      });
      setEvents(res.data.events);
    } catch { console.error('Failed to fetch events'); }
    finally { setLoading(false); }
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(d => addMonths(d, direction));
  };

  const navigateWeek = (direction: number) => {
    setCurrentDate(d => addDays(d, direction * 7));
  };

  const navigateDay = (direction: number) => {
    setCurrentDate(d => addDays(d, direction));
  };

  const handleDayClick = (date: Date) => {
    const dayEvents = events.filter(e => isSameDay(new Date(e.date), date));
    setSelectedDay(date);
    setDayEvents(dayEvents);
    setDayModalOpen(true);
  };

  const getEventsForDay = (date: Date) => events.filter(e => isSameDay(new Date(e.date), date));

  if (loading) {
    return <div className="h-[calc(100vh-200px)] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-3 border-primary-500 border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-bold text-surface-50">Calendar</h1>
          <p className="text-body-lg text-surface-400 mt-1">View your schedule across exams, tasks, and study sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex bg-surface-800/50 rounded-xl p-1 border border-surface-700/50">
            {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-surface-400 hover:text-surface-100'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
              {viewMode === 'week' && `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`}
              {viewMode === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}><ChevronLeftIcon className="h-5 w-5" /></Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date)}>Today</Button>
              <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}><ChevronRightIcon className="h-5 w-5" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {viewMode === 'month' && <MonthView currentDate={currentDate} events={events} onDayClick={handleDayClick} />}
          {viewMode === 'week' && <WeekView currentDate={currentDate} events={events} onDayClick={handleDayClick} />}
          {viewMode === 'day' && <DayView currentDate={currentDate} events={events} />}
        </CardContent>
      </Card>

      {dayModalOpen && selectedDay && (
        <Modal isOpen={dayModalOpen} onClose={() => setDayModalOpen(false)} title={format(selectedDay, 'EEEE, MMMM d, yyyy')} size="lg">
          <div className="space-y-3">
            {dayEvents.length === 0 ? (
              <p className="text-surface-400 text-center py-8">No events scheduled</p>
            ) : (
              dayEvents.map(event => (
                <EventItem key={event.id} event={event} />
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function MonthView({ currentDate, events, onDayClick }: { currentDate: Date; events: CalendarEvent[]; onDayClick: (date: Date) => void }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="p-4">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-body-xs font-medium text-surface-500 py-2">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={`aspect-square p-2 rounded-xl text-left transition-all relative ${
                !isCurrentMonth ? 'text-surface-600 hover:bg-surface-800/50' :
                today ? 'bg-primary-500/10 ring-2 ring-primary-500/30' :
                'hover:bg-surface-800/50'
              }`}
            >
              <span className={`text-body-sm font-medium ${today ? 'text-primary-400' : isCurrentMonth ? 'text-surface-50' : 'text-surface-600'}`}>
                {format(day, 'd')}
              </span>
              <div className="mt-1 space-y-1 max-h-20 overflow-hidden">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className="text-xs px-1.5 py-0.5 rounded truncate"
                    style={{ backgroundColor: event.subjectColor + '30', color: event.subjectColor }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-surface-500 text-center">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ currentDate, events, onDayClick }: { currentDate: Date; events: CalendarEvent[]; onDayClick: (date: Date) => void }) {
  const weekStart = startOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate) });

  return (
    <div className="p-4 overflow-x-auto">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-7 gap-1 mb-2">
          <div className="w-24" />
          {weekDays.map(day => (
            <div key={day.toISOString()} className="text-center py-2">
              <p className="text-body-xs text-surface-500">{format(day, 'EEE')}</p>
              <p className={`font-medium ${isToday(day) ? 'text-primary-400' : 'text-surface-50'}`}>{format(day, 'd')}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 min-h-[500px]">
          <div className="w-24 border-r border-surface-700/50">
            {[...Array(24)].map((_, hour) => (
              <div key={hour} className="h-16 border-b border-surface-700/50 text-right pr-2 pt-1 text-body-xs text-surface-500">
                {format(new Date(2000, 0, 1, hour), 'ha')}
              </div>
            ))}
          </div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="relative border-r border-surface-700/50 min-h-[500px]">
              {[...Array(24)].map((_, hour) => (
                <div key={hour} className="h-16 border-b border-surface-700/50" />
              ))}
              {getEventsForDay(day).map(event => {
                if (!event.startTime) return null;
                const start = new Date(event.startTime);
                const eventHour = start.getHours();
                const eventMin = start.getMinutes();
                const duration = event.duration || 60;
                const top = eventHour * 40 + (eventMin / 60) * 40;
                const height = (duration / 60) * 40;
                return (
                  <div
                    key={event.id}
                    className="absolute left-1 right-1 rounded-lg p-2 text-xs overflow-hidden"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      backgroundColor: event.subjectColor + '30',
                      borderColor: event.subjectColor,
                      color: event.subjectColor
                    }}
                    onClick={e => { e.stopPropagation(); onDayClick(day); }}
                  >
                    <p className="font-medium truncate">{event.title}</p>
                    <p className="truncate">{format(start, 'h:mm a')}</p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DayView({ currentDate, events }: { currentDate: Date; events: CalendarEvent[] }) {
  const dayEvents = getEventsForDay(currentDate).filter(e => e.startTime).sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime());
  const allDayEvents = getEventsForDay(currentDate).filter(e => !e.startTime);

  return (
    <div className="p-4">
      {allDayEvents.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-surface-800/50 border border-surface-700/50">
          <h4 className="font-medium text-surface-50 mb-3">All Day</h4>
          <div className="flex flex-wrap gap-2">
            {allDayEvents.map(event => (
              <EventItem key={event.id} event={event} compact />
            ))}
          </div>
        </div>
      )}
      <div className="space-y-4">
        {[...Array(24)].map((_, hour) => {
          const hourEvents = dayEvents.filter(e => {
            if (!e.startTime) return false;
            const h = new Date(e.startTime!).getHours();
            return h === hour;
          });
          return (
            <div key={hour} className="flex gap-4">
              <div className="w-16 flex-shrink-0 text-right pr-3 pt-1 text-body-sm text-surface-500">
                {format(new Date(2000, 0, 1, hour), 'ha')}
              </div>
              <div className="flex-1 border-l border-surface-700/50 min-h-[80px] relative">
                {hourEvents.map(event => (
                  <EventItem key={event.id} event={event} inline />
                ))}
                {hourEvents.length === 0 && (
                  <div className="h-16" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getEventsForDay(date: Date, events: CalendarEvent[]) {
  return events.filter(e => isSameDay(new Date(e.date), date));
}

function EventItem({ event, compact, inline }: { event: CalendarEvent; compact?: boolean; inline?: boolean }) {
  const iconMap: Record<string, any> = {
    exam: AcademicCapIcon,
    task: CheckCircleIcon,
    'study-block': DocumentTextIcon,
    session: ClockIcon
  };
  const Icon = iconMap[event.type] || DocumentTextIcon;

  const baseClass = "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium";
  const style = { backgroundColor: event.subjectColor + '20', borderColor: event.subjectColor, color: event.subjectColor };

  if (inline) {
    return (
      <div className="absolute left-0 right-0" style={{ top: 0, height: '60px', zIndex: 10 }}>
        <div className={baseClass} style={style}>
          <Icon className="h-4 w-4" />
          <span className="truncate">{event.title}</span>
          {event.duration && <span className="text-xs opacity-70">{event.duration}min</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClass} ${compact ? 'text-xs py-1.5' : ''}`} style={style}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{event.title}</span>
      {event.subject && <span className="text-xs opacity-70">{event.subject}</span>}
      {event.duration && <span className="text-xs opacity-70">{event.duration}min</span>}
      {event.priority && <Badge variant="outline" className="text-xs">{event.priority}</Badge>}
      {event.completed && <CheckCircleIcon className="h-4 w-4" />}
    </div>
  );
}