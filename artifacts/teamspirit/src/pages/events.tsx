import React, { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, ArrowRight, Compass, Shield, CheckCircle2, CircleDashed } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Events() {
  const { currentUser, teams, events, venues, publicMatches } = useAppStore();
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  const myTeamIds = teams.filter(t => t.memberIds.includes(currentUser.id)).map(t => t.id);

  const teamEvents = events
    .filter(e => myTeamIds.includes(e.teamId))
    .map(e => ({ kind: 'team' as const, item: e, datetime: e.datetime }));

  const myPublicMatches = publicMatches
    .filter(m => m.attendees.includes(currentUser.id) || m.hostId === currentUser.id)
    .map(m => ({ kind: 'public' as const, item: m, datetime: m.datetime }));

  const now = Date.now();
  const merged = [...teamEvents, ...myPublicMatches]
    .filter(x => filter === 'upcoming' ? new Date(x.datetime).getTime() >= now - 86400000 : new Date(x.datetime).getTime() < now - 86400000)
    .sort((a, b) => filter === 'upcoming'
      ? new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      : new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
    );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">
          我嘅 <span className="text-primary">活動</span>
        </h1>
        <p className="text-muted-foreground text-lg">球隊活動 + 我報咗名嘅公開場，全部喺呢度。</p>
      </header>

      <Tabs value={filter} onValueChange={v => setFilter(v as any)}>
        <TabsList className="grid w-full grid-cols-2 max-w-sm bg-black/40 p-1 rounded-xl">
          <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold uppercase tracking-wider">即將開賽</TabsTrigger>
          <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold uppercase tracking-wider">過往活動</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {merged.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-display font-bold uppercase tracking-wide mb-2">
                {filter === 'upcoming' ? '暫時冇安排' : '冇過往紀錄'}
              </h3>
              <p className="text-muted-foreground">
                {filter === 'upcoming' ? '去球隊發起新活動，或者去公開場報名。' : '踢多幾場就會見到歷史喇。'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {merged.map((entry, i) => (
                <motion.div key={`${entry.kind}-${entry.item.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  {entry.kind === 'team' ? (
                    <TeamEventRow event={entry.item} />
                  ) : (
                    <PublicMatchRow match={entry.item} />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
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
