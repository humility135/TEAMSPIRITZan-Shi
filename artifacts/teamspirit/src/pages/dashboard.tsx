import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, ArrowRight, Compass } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { currentUser, teams, events, venues, publicMatches } = useAppStore();

  const upcomingEvents = events.filter(e => e.status === 'scheduled');
  
  const nearbyMatches = publicMatches
    .filter(m => m.status === 'open')
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    .slice(0, 2);

  const myHostedMatches = publicMatches.filter(m => m.hostId === currentUser.id && m.status !== 'finished');

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">
            Welcome back, <span className="text-primary">{currentUser.name}</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-2">準備好今晚的比賽了嗎？</p>
        </div>
        <div className="flex gap-4">
          <Card className="px-6 py-4 border-border bg-card/50 backdrop-blur text-center">
            <div className="text-sm text-muted-foreground font-bold tracking-wider uppercase mb-1">本季入球</div>
            <div className="text-3xl font-display font-bold text-primary">{currentUser.seasonStats.goals}</div>
          </Card>
          <Card className="px-6 py-4 border-border bg-card/50 backdrop-blur text-center">
            <div className="text-sm text-muted-foreground font-bold tracking-wider uppercase mb-1">出席率</div>
            <div className="text-3xl font-display font-bold text-white">{currentUser.seasonStats.attendance}%</div>
          </Card>
        </div>
      </header>

      <div className="space-y-8">

          {/* Hosted matches inline */}
          {myHostedMatches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide">我主辦緊嘅公開場</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myHostedMatches.map(m => {
                  const venue = venues.find(v => v.id === m.venueId);
                  return (
                    <Link key={m.id} href={`/discover/${m.id}`}>
                      <Card className="p-4 border-primary/30 bg-primary/5 cursor-pointer hover:border-primary transition-colors h-full">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold truncate">{venue?.name}</span>
                          <Badge className="bg-primary text-primary-foreground">{m.attendees.length}/{m.maxPlayers}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(m.datetime).toLocaleString('zh-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Public Matches Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide flex items-center gap-2">
                <Compass className="w-6 h-6 text-primary" /> 你附近嘅公開場
              </h2>
              <Link href="/discover" className="text-sm text-primary font-bold hover:underline uppercase tracking-wider">探索更多</Link>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {nearbyMatches.map((match, i) => {
                const venue = venues.find(v => v.id === match.venueId);
                return (
                  <motion.div key={match.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Link href={`/discover/${match.id}`}>
                      <Card className="p-5 border-border hover:border-primary/50 transition-colors bg-card/50 backdrop-blur cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 tracking-widest uppercase">公開場</Badge>
                          <div className="text-sm font-bold">${match.fee}</div>
                        </div>
                        <h3 className="font-bold text-lg leading-tight mb-2 truncate">{venue?.name}</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {venue?.district}</div>
                          <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {new Date(match.datetime).toLocaleString('zh-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs font-bold text-primary group-hover:text-white transition-colors">
                          <span>{match.attendees.length} / {match.maxPlayers} 人已報</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
              {nearbyMatches.length === 0 && (
                 <Card className="p-8 col-span-2 text-center border-dashed border-border bg-card/30">
                   <p className="text-muted-foreground mb-4">附近暫時未有公開場</p>
                   <Link href="/discover/host"><Button variant="outline">成為第一個 Host</Button></Link>
                 </Card>
              )}
            </div>
          </div>

          {/* Team Events Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide">Upcoming Team Events</h2>
              <Link href="/events/e1" className="text-sm text-primary font-bold hover:underline uppercase tracking-wider">View All</Link>
            </div>
            
            <div className="space-y-4">
              {upcomingEvents.map((event, i) => {
                const venue = venues.find(v => v.id === event.venueId);
                const team = teams.find(t => t.id === event.teamId);
                const isAttending = event.attendingIds.includes(currentUser.id);
                
                return (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link href={`/events/${event.id}`}>
                      <Card className="p-0 overflow-hidden border-border hover:border-primary/50 transition-all group bg-card/50 backdrop-blur cursor-pointer">
                        <div className="flex flex-col sm:flex-row">
                          <div className="p-6 sm:w-1/3 border-b sm:border-b-0 sm:border-r border-border bg-black/20 flex flex-col justify-center">
                            <div className="text-sm text-primary font-bold tracking-wider uppercase mb-2">
                              {new Date(event.datetime).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric', weekday: 'short' })}
                            </div>
                            <div className="text-3xl font-display font-bold">
                              {new Date(event.datetime).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </div>
                          </div>
                          <div className="p-6 flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold px-2 py-1 rounded bg-white/10 text-white tracking-wider uppercase">{team?.name}</span>
                              {isAttending && <span className="text-xs font-bold px-2 py-1 rounded bg-green-500/20 text-green-500 tracking-wider uppercase">已確認出席</span>}
                            </div>
                            <h3 className="text-xl font-bold mb-4">{event.title}</h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {venue?.name}</div>
                              <div className="flex items-center gap-1"><Users className="w-4 h-4" /> {event.attendingIds.length} 人</div>
                            </div>
                          </div>
                          <div className="p-6 flex items-center justify-center sm:justify-end border-t sm:border-t-0 sm:border-l border-border bg-black/20">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
                              <ArrowRight className="w-6 h-6" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
      </div>
    </div>
  );
}
