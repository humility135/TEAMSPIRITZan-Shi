import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { currentUser, teams, events, venues } = useAppStore();

  const upcomingEvents = events.filter(e => e.status === 'scheduled');
  
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

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold uppercase tracking-wide">Upcoming Events</h2>
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

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold uppercase tracking-wide">My Teams</h2>
          </div>
          
          <div className="grid gap-4">
            {teams.map((team, i) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/teams/${team.id}`}>
                  <Card className="p-4 border-border bg-card/50 backdrop-blur hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-black overflow-hidden relative">
                        <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg leading-tight">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">{team.memberIds.length} Members</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
