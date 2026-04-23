import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { MapPin, Clock, Check, X, Minus, Plus, Navigation } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function EventDetail() {
  const [, params] = useRoute('/events/:eventId');
  const { events, currentUser, updateEventRSVP, updateMatchStats } = useAppStore();
  const [claimTimeLeft, setClaimTimeLeft] = useState<number | null>(null);

  const event = events.find(e => e.id === params?.eventId);

  useEffect(() => {
    let timer: any;
    if (claimTimeLeft !== null && claimTimeLeft > 0) {
      timer = setInterval(() => setClaimTimeLeft(prev => (prev! > 0 ? prev! - 1 : 0)), 1000);
    }
    return () => clearInterval(timer);
  }, [claimTimeLeft]);

  if (!event) return <div>Event not found</div>;

  const isAttending = event.attendingIds.includes(currentUser.id);
  const isDeclined = event.declinedIds.includes(currentUser.id);
  const isWaitlist = event.waitlistIds.includes(currentUser.id);

  const isToday = new Date(event.datetime).toDateString() === new Date().toDateString();
  const isFinished = event.status === 'finished';
  const hasCap = event.capacity != null;
  const isFull = hasCap && event.attendingIds.length >= (event.capacity as number);
  const venueAddress = event.venueAddress ?? '';
  const mapsUrl = venueAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueAddress)}` : '';

  const handleRSVP = (status: 'attending' | 'declined' | 'waitlist') => {
    updateEventRSVP(event.id, status);
  };

  const startClaimTimer = () => {
    setClaimTimeLeft(600); // 10 minutes in seconds
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Card */}
      <Card className="overflow-hidden border-border bg-card/50 backdrop-blur relative">
        <div className="p-8 md:p-12 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase border border-primary/20">
              {event.status === 'finished' ? '已完場' : '即將舉行'}
            </div>
            {event.fee === 0 && <Badge className="bg-green-500/15 text-green-400 border border-green-500/40 text-[10px] tracking-widest uppercase">免費</Badge>}
            {!hasCap && <Badge className="bg-primary/15 text-primary border border-primary/40 text-[10px] tracking-widest uppercase">無上限</Badge>}
            {isFull && <Badge className="bg-yellow-500/15 text-yellow-500 border border-yellow-500/40 text-[10px] tracking-widest uppercase">已滿額</Badge>}
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">{event.title}</h1>

          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="font-bold text-white text-base">{event.attendingIds.length}</span>{hasCap ? <span>/ {event.capacity}</span> : <span className="text-primary text-xs">人（無上限）</span>}
              {hasCap && <span className="text-xs">人已報名</span>}
            </span>
          </div>

          <div className="flex flex-col gap-4 text-muted-foreground">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary shrink-0" />
              <span className="text-lg">
                {new Date(event.datetime).toLocaleDateString('zh-HK', { month: 'long', day: 'numeric', weekday: 'short' })} · {new Date(event.datetime).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', hour12: false })}
                {event.endDatetime && <span className="text-muted-foreground"> – {new Date(event.endDatetime).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <div className="text-lg text-white break-words">{venueAddress || '—'}</div>
                <div className="text-xs mt-1">點 <span className="text-primary">導航</span> 可喺 Google Maps 開啟。</div>
              </div>
              {mapsUrl && (
                <Button variant="outline" size="sm" className="bg-white/5 uppercase tracking-wider font-bold text-xs gap-1.5 shrink-0" onClick={() => window.open(mapsUrl, '_blank')}>
                  <Navigation className="w-3.5 h-3.5" /> 導航
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">$</div>
              <span className="text-lg font-display text-white">{event.fee > 0 ? `$${event.fee} / 人` : '免費入場'}</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        {!isFinished && (
          <div className="border-t border-border p-4 bg-black/20 flex flex-wrap items-center justify-center gap-4">
            {isToday && !isAttending && !isFull ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full md:w-auto font-bold tracking-widest uppercase h-14 px-8 bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)] animate-pulse" onClick={startClaimTimer}>
                    立即搶位
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="font-display uppercase tracking-wider text-2xl">搶位鎖定期</DialogTitle>
                  </DialogHeader>
                  <div className="py-8 text-center space-y-4">
                    <div className="text-6xl font-display font-bold text-yellow-500">
                      {claimTimeLeft !== null ? formatTime(claimTimeLeft) : '10:00'}
                    </div>
                    <p className="text-muted-foreground">請於時限內完成付款以確認佔位。</p>
                    <Button size="lg" className="w-full h-14 font-bold tracking-wider uppercase" onClick={() => handleRSVP('attending')}>
                      Stripe 結帳 (${event.fee})
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <>
                {!isFull && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="lg" variant={isAttending ? "default" : "outline"} className={`w-full md:w-auto font-bold tracking-widest uppercase h-14 px-8 ${isAttending ? 'bg-green-500 text-black hover:bg-green-400' : ''}`}>
                        {isAttending ? <><Check className="w-5 h-5 mr-2"/> 已出席</> : `出席${event.fee > 0 ? ` ($${event.fee})` : ''}`}
                      </Button>
                    </DialogTrigger>
                    {!isAttending && (
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="font-display uppercase tracking-wider text-2xl">付款確認</DialogTitle>
                        </DialogHeader>
                        <div className="py-6">
                          <Button size="lg" className="w-full h-14 font-bold tracking-wider uppercase" onClick={() => handleRSVP('attending')}>
                            {event.fee > 0 ? `Stripe 結帳 ($${event.fee})` : '確認出席'}
                          </Button>
                        </div>
                      </DialogContent>
                    )}
                  </Dialog>
                )}

                {isFull && !isAttending && (
                  <Button size="lg" variant={isWaitlist ? "default" : "outline"} className={`w-full md:w-auto font-bold tracking-widest uppercase h-14 px-8 ${isWaitlist ? 'bg-yellow-500 text-black hover:bg-yellow-400' : ''}`} onClick={() => handleRSVP(isWaitlist ? 'none' : 'waitlist')}>
                    {isWaitlist ? '已候補（按取消）' : '加入候補'}
                  </Button>
                )}

                <Button size="lg" variant={isDeclined ? "destructive" : "outline"} className={`w-full md:w-auto font-bold tracking-widest uppercase h-14 px-8`} onClick={() => handleRSVP('declined')}>
                  {isDeclined ? <><X className="w-5 h-5 mr-2"/> 已缺席</> : '缺席'}
                </Button>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Post Match Scoreboard & Admin Panel */}
      {isFinished && (
        <div className="space-y-6">
          <Card className="p-8 border-border bg-card/50 backdrop-blur text-center">
            <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-4">Final Score</h2>
            <div className="flex items-center justify-center gap-8 md:gap-16">
              <div className="text-3xl md:text-5xl font-display font-bold">HOME</div>
              <div className="text-6xl md:text-8xl font-display font-bold text-primary tracking-tighter">
                {event.finalScore?.home} <span className="text-4xl text-muted-foreground">-</span> {event.finalScore?.away}
              </div>
              <div className="text-3xl md:text-5xl font-display font-bold">AWAY</div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card/50 backdrop-blur">
            <h2 className="text-xl font-display font-bold uppercase tracking-wide mb-6">Match Stats (Admin)</h2>
            <div className="space-y-4">
              {event.attendingIds.map(id => {
                const stat = event.playerStats.find(s => s.userId === id) || { goals: 0, assists: 0, yellow: 0, red: 0 };
                return (
                  <div key={id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <Avatar><AvatarImage src={`https://i.pravatar.cc/150?u=${id}`} /></Avatar>
                      <span className="font-bold">{id === 'u1' ? 'Ah Fai' : id === 'u2' ? 'Kit C.' : 'Ming'}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <StatCounter label="Goals" value={stat.goals} onMinus={() => updateMatchStats(event.id, id, 'goals', -1)} onPlus={() => updateMatchStats(event.id, id, 'goals', 1)} />
                      <StatCounter label="Assists" value={stat.assists} onMinus={() => updateMatchStats(event.id, id, 'assists', -1)} onPlus={() => updateMatchStats(event.id, id, 'assists', 1)} />
                      
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline" className={`w-8 h-8 rounded ${stat.yellow > 0 ? 'bg-yellow-500 border-yellow-500' : 'border-yellow-500/50 text-yellow-500'}`} onClick={() => updateMatchStats(event.id, id, 'yellow', stat.yellow > 0 ? -1 : 1)}></Button>
                        <Button size="icon" variant="outline" className={`w-8 h-8 rounded ${stat.red > 0 ? 'bg-red-500 border-red-500' : 'border-red-500/50 text-red-500'}`} onClick={() => updateMatchStats(event.id, id, 'red', stat.red > 0 ? -1 : 1)}></Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Rosters */}
      {!isFinished && (
        <div className={`grid gap-8 ${event.waitlistIds.length > 0 ? 'md:grid-cols-2' : ''}`}>
          <div className="space-y-4">
            <h3 className="text-xl font-display font-bold uppercase flex items-center justify-between">
              出席名單 <span className="text-primary">{event.attendingIds.length}{hasCap ? `/${event.capacity}` : ''}</span>
            </h3>
            <Card className="border-border bg-card/50 backdrop-blur p-4">
              {event.attendingIds.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">仲未有人出席</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {event.attendingIds.map(id => (
                    <Avatar key={id} className="w-12 h-12 ring-2 ring-primary">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${id}`} />
                    </Avatar>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {event.waitlistIds.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-display font-bold uppercase flex items-center justify-between text-muted-foreground">
                候補名單 <span>{event.waitlistIds.length}</span>
              </h3>
              <Card className="border-border bg-card/50 backdrop-blur p-4">
                <div className="space-y-2">
                  {event.waitlistIds.map((id, index) => (
                    <div key={id} className="flex items-center gap-3">
                      <div className="w-6 text-center font-display font-bold text-muted-foreground">{index + 1}</div>
                      <Avatar className="w-8 h-8"><AvatarImage src={`https://i.pravatar.cc/150?u=${id}`} /></Avatar>
                      <span className="text-sm font-medium">{id === 'u1' ? 'Ah Fai' : id === 'u2' ? 'Kit C.' : 'Ming'}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCounter({ label, value, onMinus, onPlus }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground w-12">{label}</div>
      <Button size="icon" variant="outline" className="w-8 h-8 rounded-full" onClick={onMinus}><Minus className="w-3 h-3" /></Button>
      <div className="w-6 text-center font-display font-bold text-xl">{value}</div>
      <Button size="icon" variant="outline" className="w-8 h-8 rounded-full" onClick={onPlus}><Plus className="w-3 h-3" /></Button>
    </div>
  )
}
