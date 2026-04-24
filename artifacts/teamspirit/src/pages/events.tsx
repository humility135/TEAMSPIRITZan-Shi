import React, { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, MapPin, Users, ArrowRight, Compass, Shield, CircleCheck, CircleDashed, List, LayoutGrid, ChevronLeft, ChevronRight, Filter, Star } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { extractDistrict } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

type Entry =
  | { kind: 'team'; item: any; datetime: string }
  | { kind: 'public'; item: any; datetime: string };

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function Events() {
  const { currentUser, teams, events, publicMatches } = useAppStore();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const myTeamIds = teams.filter(t => t.memberIds.includes(currentUser.id)).map(t => t.id);

  const allEntries: Entry[] = useMemo(() => {
    const teamEvents: Entry[] = events
      .filter(e => myTeamIds.includes(e.teamId))
      .map(e => ({ kind: 'team', item: e, datetime: e.datetime }));

    const myPublicMatches: Entry[] = publicMatches
      .filter(m => m.attendees.includes(currentUser.id) || m.hostId === currentUser.id)
      .map(m => ({ kind: 'public', item: m, datetime: m.datetime }));

    return [...teamEvents, ...myPublicMatches];
  }, [events, publicMatches, myTeamIds, currentUser.id]);

  const now = Date.now();
  const merged = allEntries
    .filter(x => filter === 'upcoming' ? new Date(x.datetime).getTime() >= now - 86400000 : new Date(x.datetime).getTime() < now - 86400000)
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
            我嘅 <span className="text-primary">活動</span>
          </h1>
          <p className="text-muted-foreground text-lg">球隊活動 + 我報咗名嘅公開場，全部喺呢度。</p>
        </div>
        <div className="inline-flex rounded-xl bg-black/40 p-1 self-start md:self-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setView('list')}
            className={`rounded-lg font-bold uppercase tracking-wider gap-2 ${view === 'list' ? 'bg-primary text-primary-foreground hover:bg-primary' : 'text-muted-foreground'}`}
          >
            <List className="w-4 h-4" /> 列表
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setView('calendar')}
            className={`rounded-lg font-bold uppercase tracking-wider gap-2 ${view === 'calendar' ? 'bg-primary text-primary-foreground hover:bg-primary' : 'text-muted-foreground'}`}
          >
            <LayoutGrid className="w-4 h-4" /> 日曆
          </Button>
        </div>
      </header>

      {view === 'list' ? (
        <Tabs value={filter} onValueChange={v => setFilter(v as any)}>
          <TabsList className="grid w-full grid-cols-2 max-w-sm bg-black/40 p-1 rounded-xl">
            <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold uppercase tracking-wider">即將開賽</TabsTrigger>
            <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold uppercase tracking-wider">過往活動</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {merged.length === 0 ? (
              <EmptyState filter={filter} />
            ) : (
              <div className="space-y-3">
                {merged.map((entry, i) => (
                  <motion.div key={`${entry.kind}-${entry.item.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    {entry.kind === 'team' ? <TeamEventRow event={entry.item} /> : <PublicMatchRow match={entry.item} />}
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
  const today = new Date();
  const [cursor, setCursor] = useState<Date>(selectedDate ?? today);
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <>
      <Card className="overflow-hidden bg-card/50 backdrop-blur border-border">
        {/* Month nav */}
        <div className="p-4 border-b border-border bg-black/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-wide">
                {year}年 {month + 1}月
              </h2>
              <span className="text-xs text-muted-foreground tracking-wider uppercase">
                {monthStats.total > 0
                  ? <>本月 <span className="text-primary font-bold">{monthStats.total}</span> 個活動 · {monthStats.daysWithEvents} 日</>
                  : '本月暫無活動'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={goToday} className="font-bold uppercase tracking-wider text-xs">今日</Button>
              <Button variant="ghost" size="icon" onClick={goPrev} aria-label="上個月"><ChevronLeft className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" onClick={goNext} aria-label="下個月"><ChevronRight className="w-5 h-5" /></Button>
            </div>
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

            return (
              <button
                key={i}
                onClick={() => handleDayClick(d)}
                className={`relative text-left p-1.5 sm:p-2 min-h-[72px] sm:min-h-[100px] border-r border-b border-border/60 last:border-r-0 transition-colors hover:bg-primary/5 focus:outline-none focus:bg-primary/10 ${
                  !inMonth ? 'opacity-35' : ''
                } ${isSelected ? 'bg-primary/15 ring-1 ring-inset ring-primary' : ''} ${
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
                  {events.slice(0, 2).map((e, idx) => {
                    const isPublic = e.kind === 'public';
                    return (
                      <div
                        key={idx}
                        className={`hidden sm:block truncate text-[10px] leading-tight px-1 py-0.5 rounded ${
                          isPublic
                            ? 'bg-primary/25 text-primary border-l-2 border-primary'
                            : 'bg-white/10 text-foreground border-l-2 border-white/40'
                        }`}
                        title={e.kind === 'team' ? e.item.title : '公開場'}
                      >
                        {new Date(e.datetime).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', hour12: false })} {e.kind === 'team' ? e.item.title : '公開場'}
                      </div>
                    );
                  })}
                  {events.length > 2 && (
                    <div className="hidden sm:block text-[10px] text-muted-foreground px-1">+{events.length - 2}</div>
                  )}

                  {/* Mobile: dot row */}
                  {events.length > 0 && (
                    <div className="flex sm:hidden items-center gap-0.5 flex-wrap">
                      {events.slice(0, 3).map((e, idx) => (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${e.kind === 'public' ? 'bg-primary' : 'bg-white/70'}`}
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
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/70" /> 球隊活動</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> 公開場</span>
        </div>
      </Card>

      {/* Day detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto bg-background border-t border-border">
          <SheetHeader className="text-left">
            <SheetTitle className="text-2xl font-display font-bold uppercase tracking-wide">
              {selectedDate?.toLocaleDateString('zh-HK', { month: 'long', day: 'numeric', weekday: 'long' })}
            </SheetTitle>
            <p className="text-sm text-muted-foreground">{dayEntries.length} 個活動</p>
          </SheetHeader>
          <div className="mt-4 space-y-3 pb-4">
            {dayEntries.length === 0 ? (
              <Card className="p-10 text-center border-dashed">
                <CalendarIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">呢日冇任何活動。</p>
              </Card>
            ) : (
              dayEntries.map((entry, i) => (
                <motion.div key={`${entry.kind}-${entry.item.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  {entry.kind === 'team' ? <TeamEventRow event={entry.item} /> : <PublicMatchRow match={entry.item} />}
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
  return (
    <Card className="p-12 text-center border-dashed">
      <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-xl font-display font-bold uppercase tracking-wide mb-2">
        {filter === 'upcoming' ? '暫時冇安排' : '冇過往紀錄'}
      </h3>
      <p className="text-muted-foreground">
        {filter === 'upcoming' ? '去球隊發起新活動，或者去公開場報名。' : '踢多幾場就會見到歷史喇。'}
      </p>
    </Card>
  );
}

function TeamEventRow({ event }: { event: any }) {
  const { teams, currentUser } = useAppStore();
  const venueLabel = event.venueAddress ?? '—';
  const hasCap = event.capacity != null;
  const isFull = hasCap && event.attendingIds.length >= event.capacity;
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
              {new Date(event.datetime).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric' })}
            </div>
            <div className="text-2xl font-display font-bold mt-1">
              {new Date(event.datetime).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
          </div>
          <div className="p-5 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] tracking-widest uppercase border-white/20"><Shield className="w-3 h-3 mr-1"/>{team?.name}</Badge>
              {rsvp === 'attending' && <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px] tracking-widest uppercase"><CircleCheck className="w-3 h-3 mr-1"/>已確認</Badge>}
              {rsvp === 'waitlist' && <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px] tracking-widest uppercase"><CircleDashed className="w-3 h-3 mr-1"/>候補</Badge>}
              {rsvp === 'declined' && <Badge className="bg-muted text-muted-foreground border-0 text-[10px] tracking-widest uppercase">缺席</Badge>}
              {event.status === 'finished' && <Badge variant="outline" className="text-[10px] tracking-widest uppercase">已完場</Badge>}
              {isFull && <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-[10px] tracking-widest uppercase">已滿額</Badge>}
            </div>
            <h3 className="font-bold text-lg leading-tight truncate">{event.title}</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1 min-w-0"><MapPin className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[220px]">{venueLabel}</span></span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.attendingIds.length}{hasCap ? `/${event.capacity}` : ''} 人{!hasCap && <span className="text-primary ml-1">無上限</span>}</span>
              <span className={event.fee > 0 ? '' : 'text-green-400 font-bold'}>{event.fee > 0 ? `$${event.fee}/人` : '免費'}</span>
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

function PublicMatchRow({ match }: { match: any }) {
  const { venues, currentUser, hostProfiles, rateHost } = useAppStore();
  const [isRateOpen, setIsRateOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const venue = match.venueId ? venues.find((v: any) => v.id === match.venueId) : undefined;
  const venueLabel = venue?.name ?? match.venueAddress ?? '—';
  const districtLabel = extractDistrict(venue?.district || match.venueAddress || '') || venue?.district || '球場地址';
  const isHost = match.hostId === currentUser.id;
  const isPast = new Date(match.datetime).getTime() < Date.now();
  const isCancelled = match.status === 'cancelled';

  const hostProfile = hostProfiles?.find((h: any) => h.userId === match.hostId);
  const existingReview = hostProfile?.reviews?.find((r: any) => r.reviewerId === currentUser.id);

  const handleRateSubmit = async () => {
    setIsSubmitting(true);
    await rateHost(match.hostId, rating, comment);
    setIsSubmitting(false);
    setIsRateOpen(false);
  };

  return (
    <>
      <Link href={`/discover/${match.id}`}>
        <Card className="p-0 overflow-hidden border-primary/20 hover:border-primary/60 transition-all bg-primary/5 cursor-pointer group">
          <div className="flex flex-col sm:flex-row">
            <div className="p-5 sm:w-32 border-b sm:border-b-0 sm:border-r border-primary/20 bg-primary/10 flex flex-col justify-center items-center text-center">
              <div className="text-xs text-primary font-bold tracking-wider uppercase">
                {new Date(match.datetime).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-2xl font-display font-bold mt-1">
                {new Date(match.datetime).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
            </div>
            <div className="p-5 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className="bg-primary/20 text-primary border-0 text-[10px] tracking-widest uppercase"><Compass className="w-3 h-3 mr-1"/>公開場</Badge>
                {isHost ? (
                  <Badge className="bg-primary text-primary-foreground border-0 text-[10px] tracking-widest uppercase">我主辦</Badge>
                ) : (
                  <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px] tracking-widest uppercase"><CircleCheck className="w-3 h-3 mr-1"/>已報名</Badge>
                )}
                {isCancelled && <Badge variant="destructive" className="text-[10px] tracking-widest uppercase">已取消</Badge>}
              </div>
              <h3 className="font-bold text-lg leading-tight truncate">{venueLabel}</h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {districtLabel}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {match.attendees.length}{match.maxPlayers != null ? `/${match.maxPlayers}` : ''}</span>
                <span>${match.fee}/人</span>
              </div>
            </div>
            <div className="p-5 flex flex-col sm:flex-row items-center justify-end gap-3 border-t sm:border-t-0 sm:border-l border-primary/20 bg-black/20">
              {!isHost && isPast && !isCancelled && (
                <Button 
                  size="sm"
                  variant={existingReview ? "outline" : "default"}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (existingReview) {
                      setRating(existingReview.rating);
                      setComment(existingReview.comment || '');
                    } else {
                      setRating(5);
                      setComment('');
                    }
                    setIsRateOpen(true);
                  }}
                  className="z-10 whitespace-nowrap"
                >
                  {existingReview ? '已評分' : '評分主辦'}
                </Button>
              )}
              <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Card>
      </Link>

      <Dialog open={isRateOpen} onOpenChange={setIsRateOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wide text-2xl flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> 為主辦人評分
            </DialogTitle>
            <DialogDescription>您的評分將幫助其他球友了解主辦人的舉辦質素。</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">評分 (1-5 星)</div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        rating >= star ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">留言 (選填)</div>
              <Textarea 
                placeholder="分享您的活動體驗..." 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none h-24"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsRateOpen(false)}>取消</Button>
            <Button onClick={handleRateSubmit} disabled={!rating || isSubmitting}>
              {isSubmitting ? '提交中...' : '提交評分'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
