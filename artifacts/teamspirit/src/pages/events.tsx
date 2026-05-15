import React, { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, MapPin, Users, ArrowRight, Compass, Shield, CheckCircle2, CircleDashed, List, LayoutGrid, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import { Event, PublicMatch } from '@/lib/types';

type Entry =
  | { kind: 'team'; item: Event; datetime: string }
  | { kind: 'public'; item: PublicMatch & { title: string }; datetime: string };

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function Events() {
  const { currentUser, teams, events, publicMatches, venues } = useAppStore();
  const { t, lang } = useI18n();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const myTeamIds = teams.filter(t => t.memberIds.includes(currentUser.id)).map(t => t.id);

  const allEntries: Entry[] = useMemo(() => {
    const teamEvents: Entry[] = events
      .filter(e => myTeamIds.includes(e.teamId))
      .map(e => ({ kind: 'team', item: e, datetime: e.datetime }));

    const joinedPublic: Entry[] = publicMatches
      .filter(m => m.attendees.includes(currentUser.id))
      .map(m => {
        const v = venues.find(x => x.id === m.venueId);
        const baseVenueName = (lang === 'en' ? (v?.nameEn || m.venueAddressEn || m.venueAddress) : (v?.name || m.venueAddress)) || t('publicMatch');
        const shouldAppendCourt =
          !!v &&
          !!m.venueAddress &&
          m.venueAddress !== v.address &&
          m.venueAddress !== v.addressEn &&
          m.venueAddress !== v.name &&
          m.venueAddress !== v.nameEn;
        const venueName = shouldAppendCourt
          ? `${lang === 'en' ? (v!.nameEn || v!.name) : v!.name} · ${m.venueAddress}`
          : baseVenueName;
        return { 
          kind: 'public', 
          item: { ...m, title: venueName }, 
          datetime: m.datetime 
        };
      });

    return [...teamEvents, ...joinedPublic];
  }, [events, myTeamIds, publicMatches, currentUser.id, venues]);

  const now = Date.now();
  const merged = allEntries
    .filter(x => {
      const isDone = x.item.status === 'finished' || x.item.status === 'cancelled';
      if (filter === 'upcoming') return !isDone && new Date(x.datetime).getTime() >= now - 86400000;
      return isDone || new Date(x.datetime).getTime() < now - 86400000;
    })
    .sort((a, b) => filter === 'upcoming'
      ? new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      : new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
    );

  // Calendar view: collect all dates that have events
  const eventDates = useMemo(() => allEntries.map(e => new Date(e.datetime)), [allEntries]);

  const dayEntries = useMemo(() => {
    if (!selectedDate) return [];
    return allEntries
      .filter(e => sameDay(new Date(e.datetime), selectedDate))
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }, [allEntries, selectedDate]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">
            {t('eventsTitlePrefix')}{lang === 'en' ? ' ' : ''}<span className="text-primary">{t('eventsTitleHighlight')}</span>
          </h1>
          <p className="text-muted-foreground text-lg">{t('eventsDesc')}</p>
        </div>
        <div className="inline-flex rounded-xl bg-black/40 p-1 self-start md:self-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setView('list')}
            className={`rounded-lg font-bold uppercase tracking-wider gap-2 ${view === 'list' ? 'bg-primary text-primary-foreground hover:bg-primary' : 'text-muted-foreground'}`}
          >
            <List className="w-4 h-4" /> {t('eventsListView')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setView('calendar')}
            className={`rounded-lg font-bold uppercase tracking-wider gap-2 ${view === 'calendar' ? 'bg-primary text-primary-foreground hover:bg-primary' : 'text-muted-foreground'}`}
          >
            <LayoutGrid className="w-4 h-4" /> {t('eventsCalendarView')}
          </Button>
        </div>
      </header>

      {view === 'list' ? (
        <Tabs value={filter} onValueChange={v => { if (v === 'upcoming' || v === 'past') setFilter(v); }}>
          <TabsList className="grid w-full grid-cols-2 max-w-sm bg-black/40 p-1 rounded-xl">
            <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold uppercase tracking-wider">{t('eventsUpcoming')}</TabsTrigger>
            <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold uppercase tracking-wider">{t('eventsPast')}</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {merged.length === 0 ? (
              <EmptyState filter={filter} />
            ) : (
              <div className="space-y-3">
                {merged.map((entry, i) => (
                  <motion.div key={`${entry.kind}-${entry.item.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <EventRow entry={entry} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <FullScreenCalendar
          allEntries={allEntries}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          dayEntries={dayEntries}
        />
      )}
    </div>
  );
}

function FullScreenCalendar({
  allEntries,
  selectedDate,
  onSelectDate,
  dayEntries,
}: {
  allEntries: Entry[];
  selectedDate: Date | undefined;
  onSelectDate: (d: Date | undefined) => void;
  dayEntries: Entry[];
}) {
  const { t, lang } = useI18n();
  const today = new Date();
  const [cursor, setCursor] = useState<Date>(selectedDate ?? today);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [onlyEventDays, setOnlyEventDays] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  // Build 6-week grid (Sunday-start)
  const grid = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startDay = firstOfMonth.getDay(); // 0 = Sun
    const start = new Date(year, month, 1 - startDay);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [year, month]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of allEntries) {
      const d = new Date(e.datetime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    }
    return map;
  }, [allEntries]);

  const monthStats = useMemo(() => {
    let total = 0;
    let daysWithEvents = 0;
    for (const d of grid) {
      if (d.getMonth() !== month) continue;
      const list = entriesByDay.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ?? [];
      if (list.length > 0) {
        daysWithEvents++;
        total += list.length;
      }
    }
    return { total, daysWithEvents };
  }, [grid, entriesByDay, month]);

  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const goPrev = () => setCursor(new Date(year, month - 1, 1));
  const goNext = () => setCursor(new Date(year, month + 1, 1));
  const goToday = () => {
    const t = new Date();
    setCursor(t);
    onSelectDate(t);
  };

  const handleDayClick = (d: Date) => {
    onSelectDate(d);
    setSheetOpen(true);
  };

  const weekdays = t('eventsWeekdays').split(',');

  return (
    <>
      <Card className="overflow-hidden bg-card/50 backdrop-blur border-border">
        {/* Month nav */}
        <div className="p-4 border-b border-border bg-black/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-wide">
                {year}{t('eventsYear')} {month + 1}{t('eventsMonth')}
              </h2>
              <span className="text-xs text-muted-foreground tracking-wider uppercase">
                {monthStats.total > 0
                  ? <>{t('eventsMonthStats')} <span className="text-primary font-bold">{monthStats.total}</span> {t('eventsMonthEvents')} · {monthStats.daysWithEvents} {t('eventsMonthDays')}</>
                  : t('eventsMonthNone')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={goToday} className="font-bold uppercase tracking-wider text-xs">{t('eventsToday')}</Button>
              <Button variant="ghost" size="icon" onClick={goPrev} aria-label={t('eventsPrevMonth')}><ChevronLeft className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" onClick={goNext} aria-label={t('eventsNextMonth')}><ChevronRight className="w-5 h-5" /></Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyEventDays(v => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase border transition-colors ${
                onlyEventDays
                  ? 'bg-primary/15 text-primary border-primary/40'
                  : 'bg-white/5 text-muted-foreground border-white/10 hover:text-white'
              }`}
            >
              <Filter className="w-3 h-3" /> {t('eventsFilterOnlyDays')}
            </button>
          </div>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-border bg-black/20">
          {weekdays.map((w, i) => (
            <div
              key={w}
              className={`text-center py-2 text-[11px] sm:text-xs font-bold tracking-widest uppercase ${i === 0 || i === 6 ? 'text-primary/70' : 'text-muted-foreground'}`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Day grid: 6 weeks. Each row min-height responsive */}
        <div className="grid grid-cols-7 grid-rows-6 auto-rows-fr">
          {grid.map((d, i) => {
            const inMonth = d.getMonth() === month;
            const isToday = sameDay(d, today);
            const isSelected = !!selectedDate && sameDay(d, selectedDate);
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            const events = entriesByDay.get(dayKey(d)) ?? [];

            const dimNoEvent = onlyEventDays && events.length === 0 && inMonth;
            return (
              <button
                key={i}
                onClick={() => handleDayClick(d)}
                className={`relative text-left p-1.5 sm:p-2 min-h-[72px] sm:min-h-[100px] border-r border-b border-border/60 last:border-r-0 transition-colors hover:bg-primary/5 focus:outline-none focus:bg-primary/10 ${
                  !inMonth ? 'opacity-35' : ''
                } ${dimNoEvent ? 'opacity-25' : ''} ${isSelected ? 'bg-primary/15 ring-1 ring-inset ring-primary' : ''} ${
                  (i + 1) % 7 === 0 ? 'border-r-0' : ''
                } ${i >= 35 ? 'border-b-0' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center justify-center text-xs sm:text-sm font-bold ${
                      isToday
                        ? 'w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary text-primary-foreground'
                        : isWeekend
                        ? 'text-primary/80'
                        : 'text-foreground'
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {events.length > 0 && (
                    <span className="text-[9px] sm:text-[10px] font-bold text-primary">{events.length}</span>
                  )}
                </div>

                {/* Event chips - hide title on mobile, show on sm+ */}
                <div className="space-y-0.5">
                  {events.slice(0, 2).map((e, idx) => (
                    <div
                      key={idx}
                      className="hidden sm:block truncate text-[10px] leading-tight px-1 py-0.5 rounded bg-white/10 text-foreground border-l-2 border-white/40"
                      title={e.item.title}
                    >
                      {new Date(e.datetime).toLocaleTimeString(lang === 'en' ? 'en-US' : 'zh-HK', { hour: '2-digit', minute: '2-digit', hour12: false })} {e.item.title}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div className="hidden sm:block text-[10px] text-muted-foreground px-1">+{events.length - 2}</div>
                  )}

                  {/* Mobile: dot row */}
                  {events.length > 0 && (
                    <div className="flex sm:hidden items-center gap-0.5 flex-wrap">
                      {events.slice(0, 3).map((e, idx) => (
                        <span
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full bg-white/70"
                        />
                      ))}
                      {events.length > 3 && <span className="text-[9px] text-muted-foreground ml-0.5">+{events.length - 3}</span>}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 p-3 border-t border-border bg-black/20 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/70" /> {t('eventsLegendTeam')}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> {t('eventsLegendPublic')}</span>
        </div>
      </Card>

      {/* Day detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto bg-background border-t border-border">
          <SheetHeader className="text-left">
            <SheetTitle className="text-2xl font-display font-bold uppercase tracking-wide">
              {selectedDate?.toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-HK', { month: 'long', day: 'numeric', weekday: 'long' })}
            </SheetTitle>
            <p className="text-sm text-muted-foreground">{dayEntries.length} {t('eventsDayEvents')}</p>
          </SheetHeader>
          <div className="mt-4 space-y-3 pb-4">
            {dayEntries.length === 0 ? (
              <Card className="p-10 text-center border-dashed">
                <CalendarIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t('eventsDayNone')}</p>
              </Card>
            ) : (
              dayEntries.map((entry, i) => (
                <motion.div key={`${entry.kind}-${entry.item.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <EventRow entry={entry} />
                </motion.div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function EmptyState({ filter }: { filter: 'upcoming' | 'past' }) {
  const { t } = useI18n();
  return (
    <Card className="p-12 text-center border-dashed">
      <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-xl font-display font-bold uppercase tracking-wide mb-2">
        {filter === 'upcoming' ? t('eventsEmptyUpcomingTitle') : t('eventsEmptyPastTitle')}
      </h3>
      <p className="text-muted-foreground">
        {filter === 'upcoming' ? t('eventsEmptyUpcomingDesc') : t('eventsEmptyPastDesc')}
      </p>
    </Card>
  );
}

function EventRow({ entry }: { entry: Entry }) {
  const { kind, item: event } = entry;
  const { teams, currentUser, venues } = useAppStore();
  const { t, lang } = useI18n();
  const isTeam = kind === 'team';
  const venue = event.venueId ? venues.find(v => v.id === event.venueId) : undefined;
  const baseVenueLabel = lang === 'en'
    ? (venue?.nameEn ?? (event as any).venueAddressEn ?? event.venueAddress ?? '—')
    : (venue?.name ?? event.venueAddress ?? '—');
  const shouldAppendCourt =
    !!venue &&
    !!event.venueAddress &&
    event.venueAddress !== venue.address &&
    event.venueAddress !== venue.addressEn &&
    event.venueAddress !== venue.name &&
    event.venueAddress !== venue.nameEn;
  const venueLabel = shouldAppendCourt
    ? `${lang === 'en' ? (venue!.nameEn ?? venue!.name) : venue!.name} · ${event.venueAddress}`
    : baseVenueLabel;
  
  if (isTeam) {
    const cap = event.capacity;
    const hasCap = cap != null;
    const isFull = hasCap && event.attendingIds.length >= cap;
    const team = teams.find(t => t.id === event.teamId);
    const rsvp = event.attendingIds.includes(currentUser.id)
      ? 'attending'
      : event.declinedIds.includes(currentUser.id)
      ? 'declined'
      : event.waitlistIds.includes(currentUser.id)
      ? 'waitlist'
      : 'none';

    return (
      <Link href={`/events/${event.id}`}>
        <Card className="p-0 overflow-hidden border-border hover:border-primary/50 transition-all bg-card/50 backdrop-blur cursor-pointer group">
          <div className="flex flex-col sm:flex-row">
            <div className="p-5 sm:w-32 border-b sm:border-b-0 sm:border-r border-border bg-black/30 flex flex-col justify-center items-center text-center">
              <div className="text-xs text-primary font-bold tracking-wider uppercase">
                {new Date(event.datetime).toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-HK', { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-2xl font-display font-bold mt-1">
                {new Date(event.datetime).toLocaleTimeString(lang === 'en' ? 'en-US' : 'zh-HK', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
            </div>
            <div className="p-5 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] tracking-widest uppercase border-white/20"><Shield className="w-3 h-3 mr-1"/>{team?.name}</Badge>
                {rsvp === 'attending' && <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px] tracking-widest uppercase"><CheckCircle2 className="w-3 h-3 mr-1"/>{t('eventsConfirmed')}</Badge>}
                {rsvp === 'waitlist' && <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px] tracking-widest uppercase"><CircleDashed className="w-3 h-3 mr-1"/>{t('eventsWaitlist')}</Badge>}
                {rsvp === 'declined' && <Badge className="bg-muted text-muted-foreground border-0 text-[10px] tracking-widest uppercase">{t('eventsAbsent')}</Badge>}
                {event.status === 'finished' && <Badge variant="outline" className="text-[10px] tracking-widest uppercase">{t('eventsFinished')}</Badge>}
                {isFull && <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-[10px] tracking-widest uppercase">{t('eventsFull')}</Badge>}
              </div>
              <h3 className="font-bold text-lg leading-tight truncate">{event.title}</h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1 min-w-0"><MapPin className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[220px]">{venueLabel}</span></span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.attendingIds.length}{hasCap ? `/${cap}` : ''} {t('pax')}{!hasCap && <span className="text-primary ml-1">{t('unlimited')}</span>}</span>
                <span className={event.fee > 0 ? '' : 'text-green-400 font-bold'}>{event.fee > 0 ? `$${event.fee}/${t('perPerson')}` : t('eventsFree')}</span>
              </div>
            </div>
            <div className="p-5 flex items-center justify-end border-t sm:border-t-0 sm:border-l border-border bg-black/20">
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </Card>
      </Link>
    );
  } else {
    // Public Match
    const maxP = event.maxPlayers;
    const hasCap = maxP != null;
    const isFull = hasCap && event.attendees.length >= maxP;
    const isAttending = event.attendees.includes(currentUser.id);

    return (
      <Link href={`/discover/${event.id}`}>
        <Card className="p-0 overflow-hidden border-border hover:border-primary/50 transition-all bg-card/50 backdrop-blur cursor-pointer group">
          <div className="flex flex-col sm:flex-row">
            <div className="p-5 sm:w-32 border-b sm:border-b-0 sm:border-r border-border bg-black/30 flex flex-col justify-center items-center text-center">
              <div className="text-xs text-primary font-bold tracking-wider uppercase">
                {new Date(event.datetime).toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-HK', { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-2xl font-display font-bold mt-1">
                {new Date(event.datetime).toLocaleTimeString(lang === 'en' ? 'en-US' : 'zh-HK', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
            </div>
            <div className="p-5 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] tracking-widest uppercase border-primary/40 bg-primary/10 text-primary">{t('publicLabel')}</Badge>
                {isAttending && <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px] tracking-widest uppercase"><CheckCircle2 className="w-3 h-3 mr-1"/>{t('registered')}</Badge>}
                {event.status === 'finished' && <Badge variant="outline" className="text-[10px] tracking-widest uppercase">{t('eventsFinished')}</Badge>}
                {isFull && <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-[10px] tracking-widest uppercase">{t('eventsFull')}</Badge>}
              </div>
              <h3 className="font-bold text-lg leading-tight truncate">{event.title}</h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1 min-w-0"><MapPin className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[220px]">{venueLabel}</span></span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.attendees.length}{hasCap ? `/${maxP}` : ''} {t('pax')}{!hasCap && <span className="text-primary ml-1">{t('unlimited')}</span>}</span>
                <span className={event.fee > 0 ? 'text-primary font-bold' : 'text-green-400 font-bold'}>{event.fee > 0 ? `$${event.fee}/${t('perPerson')}` : t('eventsFree')}</span>
              </div>
            </div>
            <div className="p-5 flex items-center justify-end border-t sm:border-t-0 sm:border-l border-border bg-black/20">
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </Card>
      </Link>
    );
  }
}
