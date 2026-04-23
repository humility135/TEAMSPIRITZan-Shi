import React, { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, MapPin, Users, ArrowRight, Compass, Shield, CheckCircle2, CircleDashed, List, LayoutGrid } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';

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
        <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start">
          <Card className="p-4 bg-card/50 backdrop-blur border-border w-fit mx-auto lg:mx-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{ hasEvent: eventDates }}
              modifiersClassNames={{
                hasEvent: 'relative font-bold text-primary after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary',
              }}
              className="rounded-xl"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 px-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" /> 有活動嘅日子
            </div>
          </Card>

          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide">
                {selectedDate
                  ? selectedDate.toLocaleDateString('zh-HK', { month: 'long', day: 'numeric', weekday: 'short' })
                  : '揀一個日子'}
              </h2>
              <span className="text-sm text-muted-foreground">{dayEntries.length} 個活動</span>
            </div>

            {dayEntries.length === 0 ? (
              <Card className="p-10 text-center border-dashed">
                <CalendarIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">呢日冇任何活動。</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {dayEntries.map((entry, i) => (
                  <motion.div key={`${entry.kind}-${entry.item.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    {entry.kind === 'team' ? <TeamEventRow event={entry.item} /> : <PublicMatchRow match={entry.item} />}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
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
  const { teams, venues, currentUser } = useAppStore();
  const venue = venues.find(v => v.id === event.venueId);
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
              {rsvp === 'attending' && <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px] tracking-widest uppercase"><CheckCircle2 className="w-3 h-3 mr-1"/>已確認</Badge>}
              {rsvp === 'waitlist' && <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px] tracking-widest uppercase"><CircleDashed className="w-3 h-3 mr-1"/>候補</Badge>}
              {rsvp === 'declined' && <Badge className="bg-muted text-muted-foreground border-0 text-[10px] tracking-widest uppercase">缺席</Badge>}
              {event.status === 'finished' && <Badge variant="outline" className="text-[10px] tracking-widest uppercase">已完場</Badge>}
            </div>
            <h3 className="font-bold text-lg leading-tight truncate">{event.title}</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {venue?.name}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.attendingIds.length} 人</span>
              {event.fee > 0 && <span>${event.fee}/人</span>}
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
  const { venues, currentUser } = useAppStore();
  const venue = venues.find(v => v.id === match.venueId);
  const isHost = match.hostId === currentUser.id;

  return (
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
                <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px] tracking-widest uppercase"><CheckCircle2 className="w-3 h-3 mr-1"/>已報名</Badge>
              )}
              {match.status === 'cancelled' && <Badge variant="destructive" className="text-[10px] tracking-widest uppercase">已取消</Badge>}
            </div>
            <h3 className="font-bold text-lg leading-tight truncate">{venue?.name}</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {venue?.district}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {match.attendees.length}/{match.maxPlayers}</span>
              <span>${match.fee}/人</span>
            </div>
          </div>
          <div className="p-5 flex items-center justify-end border-t sm:border-t-0 sm:border-l border-primary/20 bg-black/20">
            <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
