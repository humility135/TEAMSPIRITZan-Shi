import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, ArrowRight, Compass, Shield, Plus } from 'lucide-react';
import { useAppStore, getAggregatedStats } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { currentUser, teams, events, venues, publicMatches } = useAppStore();
  const aggStats = getAggregatedStats(currentUser);

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
            <div className="text-3xl font-display font-bold text-primary">{aggStats.goals}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 tracking-wider">所有球隊</div>
          </Card>
          <Card className="px-6 py-4 border-border bg-card/50 backdrop-blur text-center">
            <div className="text-sm text-muted-foreground font-bold tracking-wider uppercase mb-1">平均出席率</div>
            <div className="text-3xl font-display font-bold text-white">{aggStats.attendance}%</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 tracking-wider">所有球隊</div>
          </Card>
        </div>
      </header>

      <div className="space-y-8">

          {/* My Teams quick access */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" /> 我嘅球隊
              </h2>
              <Link href="/teams" className="text-sm text-primary font-bold hover:underline uppercase tracking-wider">全部球隊</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {teams.slice(0, 6).map((team, i) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="shrink-0"
                >
                  <Link href={`/teams/${team.id}`}>
                    <Card className="w-36 p-3 border-border bg-card/50 backdrop-blur hover:border-primary/50 transition-colors cursor-pointer group text-center">
                      <div className="w-16 h-16 mx-auto rounded-xl bg-black overflow-hidden relative mb-3">
                        <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl" />
                      </div>
                      <div className="font-bold text-sm leading-tight truncate">{team.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{team.memberIds.length} 人</div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
              <Link href="/teams" className="shrink-0">
                <Card className="w-36 h-full min-h-[148px] p-3 border-dashed border-border bg-card/20 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer flex flex-col items-center justify-center text-muted-foreground hover:text-primary">
                  <Plus className="w-8 h-8 mb-2" />
                  <div className="text-xs font-bold tracking-wider uppercase">新增球隊</div>
                </Card>
              </Link>
            </div>
          </div>

          {/* Hosted matches inline */}
          {myHostedMatches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide">我主辦緊嘅公開場</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myHostedMatches.map(m => {
                  const venue = m.venueId ? venues.find(v => v.id === m.venueId) : undefined;
                  const label = venue?.name ?? m.venueAddress ?? '—';
                  return (
                    <Link key={m.id} href={`/discover/${m.id}`}>
                      <Card className="p-4 border-primary/30 bg-primary/5 cursor-pointer hover:border-primary transition-colors h-full">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold truncate">{label}</span>
                          <Badge className="bg-primary text-primary-foreground">{m.attendees.length}{m.maxPlayers != null ? `/${m.maxPlayers}` : ''}</Badge>
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
                const venue = match.venueId ? venues.find(v => v.id === match.venueId) : undefined;
                const label = venue?.name ?? match.venueAddress ?? '—';
                const district = venue?.district ?? '';
                return (
                  <motion.div key={match.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Link href={`/discover/${match.id}`}>
                      <Card className="p-5 border-border hover:border-primary/50 transition-colors bg-card/50 backdrop-blur cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 tracking-widest uppercase">公開場</Badge>
                          <div className="text-sm font-bold">${match.fee}</div>
                        </div>
                        <h3 className="font-bold text-lg leading-tight mb-2 truncate">{label}</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {district || '搵手填地址'}</div>
                          <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {new Date(match.datetime).toLocaleString('zh-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs font-bold text-primary group-hover:text-white transition-colors">
                          <span>{match.attendees.length}{match.maxPlayers != null ? ` / ${match.maxPlayers}` : ''} 人已報</span>
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
                const venueLabel = event.venueAddress ?? venues.find(v => v.id === event.venueId)?.name ?? '—';
                const team = teams.find(t => t.id === event.teamId);
                const isAttending = event.attendingIds.includes(currentUser.id);
                const hasCap = event.capacity != null;
                
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
                              <div className="flex items-center gap-1 min-w-0"><MapPin className="w-4 h-4 shrink-0" /> <span className="truncate max-w-[200px]">{venueLabel}</span></div>
                              <div className="flex items-center gap-1"><Users className="w-4 h-4" /> {event.attendingIds.length}{hasCap ? `/${event.capacity}` : ''} 人{!hasCap && <span className="text-primary text-xs ml-1">無上限</span>}</div>
                              {event.fee === 0 && <span className="text-green-400 text-xs font-bold">免費</span>}
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
