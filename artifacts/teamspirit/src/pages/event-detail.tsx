import React, { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { MapPin, Clock, Check, X, Minus, Plus, Navigation, Zap, Hourglass, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

function useNow(intervalMs: number = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function formatRemaining(ms: number) {
  if (ms <= 0) return '00:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function EventDetail() {
  const [, params] = useRoute('/events/:eventId');
  const { events, currentUser, updateEventRSVP, updateMatchStats, acceptEventSlot, payEventSlot, declineEventSlot } = useAppStore();
  const now = useNow(1000);
  const [payOfferId, setPayOfferId] = useState<string | null>(null);

  const event = events.find(e => e.id === params?.eventId);
  if (!event) return <div>Event not found</div>;

  const isAttending = event.attendingIds.includes(currentUser.id);
  const isDeclined = event.declinedIds.includes(currentUser.id);
  const isWaitlist = event.waitlistIds.includes(currentUser.id);
  const waitlistPos = event.waitlistIds.indexOf(currentUser.id) + 1;

  const isFinished = event.status === 'finished';
  const hasCap = event.capacity != null;
  const isFull = hasCap && event.attendingIds.length >= (event.capacity as number);
  const venueAddress = event.venueAddress ?? '';
  const mapsUrl = venueAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueAddress)}` : '';

  const myOffer = event.slotOffers.find(o => o.eligibleUserIds.includes(currentUser.id) || o.acceptedBy === currentUser.id);
  const acceptedByMe = myOffer?.acceptedBy === currentUser.id;
  const deadlineMs = myOffer?.paymentDeadline ? new Date(myOffer.paymentDeadline).getTime() : null;
  const remainingMs = deadlineMs != null ? deadlineMs - now : 0;
  
  const [paymentAck, setPaymentAck] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRSVP = (status: 'attending' | 'declined' | 'none') => {
    setIsProcessing(true);
    setTimeout(() => {
      updateEventRSVP(event.id, status);
      setIsProcessing(false);
      if (status === 'attending' && isFull && !isAttending) toast.info('已滿額，已自動加入候補名單');
    }, 1500);
  };

  const handleAcceptOffer = async () => {
    if (!myOffer) return;
    const { needPayment } = await acceptEventSlot(event.id, myOffer.id);
    if (needPayment) setPayOfferId(myOffer.id);
    else toast.success('已自動補上！');
  };

  const handlePayOffer = async () => {
    if (!payOfferId) return;
    const r = await payEventSlot(event.id, payOfferId);
    setPayOfferId(null);
    if (r.ok) toast.success('付款成功，已正式補上');
    else if (r.reason === 'expired') toast.error('呢個補位機會已過期');
    else if (r.reason === 'full') toast.error('已滿額，無法完成補位');
    else toast.error('付款失敗，請再試');
  };

  const handleDeclineOffer = async () => {
    if (!myOffer) return;
    await declineEventSlot(event.id, myOffer.id);
    toast.info('已放棄此次補位');
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

        {/* Slot Offer Banner */}
        {!isFinished && myOffer && (
          <div className={`border-t border-border p-5 ${myOffer.mode === 'race' ? 'bg-yellow-500/10' : 'bg-primary/10'}`}>
            <div className="flex items-start gap-3">
              {myOffer.mode === 'race' ? <Zap className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" /> : <Hourglass className="w-6 h-6 text-primary shrink-0 mt-0.5" />}
              <div className="flex-1 space-y-3">
                <div>
                  <div className="font-display uppercase tracking-wide text-lg">
                    {myOffer.mode === 'race' ? '搶位中（24h 內）' : '輪到你補位'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {acceptedByMe
                      ? `已接受！請於 1 小時內完成付款。剩餘 `
                      : myOffer.mode === 'race'
                        ? `有人放飛機，候補嘅各位鬥快 claim。先 claim 先得，仲要 1 小時內付款先正式入到名單。`
                        : `你係候補名單第 1 位，呢個位優先畀你。1 小時內接受並付款，否則自動畀下一位。`}
                    {acceptedByMe && deadlineMs && (
                      <span className="inline-block ml-1 font-mono font-bold text-yellow-400">{formatRemaining(remainingMs)}</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!acceptedByMe ? (
                    <>
                      <Button size="lg" className="font-bold uppercase tracking-wider bg-yellow-500 hover:bg-yellow-400 text-black" onClick={handleAcceptOffer}>
                        {event.fee > 0 ? `接受並付款 ($${event.fee})` : '接受補位'}
                      </Button>
                      <Button size="lg" variant="outline" onClick={handleDeclineOffer}>放棄</Button>
                    </>
                  ) : (
                    <>
                      <Button size="lg" className="font-bold uppercase tracking-wider bg-primary text-primary-foreground" onClick={() => setPayOfferId(myOffer.id)}>
                        立即付款 (${event.fee})
                      </Button>
                      <Button size="lg" variant="outline" onClick={handleDeclineOffer}>放棄</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        {!isFinished && (
          <div className="border-t border-border p-4 bg-black/20 space-y-3">
            {isWaitlist && !myOffer && (
              <div className="text-center text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
                你已加入候補（第 {waitlistPos} 位）— 有人放飛機，系統會即時通知你
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Dialog onOpenChange={(open) => { if(open) setPaymentAck(false); }}>
                <DialogTrigger asChild>
                  {isAttending ? (
                    <Button size="lg" className="w-full md:w-auto font-bold tracking-widest uppercase h-14 px-8 bg-green-500 text-black hover:bg-green-400">
                      <Check className="w-5 h-5 mr-2"/> 已出席
                    </Button>
                  ) : isWaitlist ? (
                    <Button size="lg" variant="outline" className="w-full md:w-auto font-bold tracking-widest uppercase h-14 px-8">
                      已喺候補名單
                    </Button>
                  ) : isFull ? (
                    <Button size="lg" className="w-full md:w-auto font-bold tracking-widest uppercase h-14 px-8 text-lg animate-pulse hover:animate-none bg-primary text-primary-foreground">
                      加入候補{event.fee > 0 ? '（$0 留位）' : ''}
                    </Button>
                  ) : (
                    <Button size="lg" className="w-full md:w-auto font-bold tracking-widest uppercase h-14 px-8 text-lg animate-pulse hover:animate-none bg-primary text-primary-foreground">
                      我要報名{event.fee > 0 ? ` ($${event.fee})` : ''}
                    </Button>
                  )}
                </DialogTrigger>
                {!isAttending && !isWaitlist && (
                  <DialogContent className="sm:max-w-md border-border bg-card">
                    <DialogHeader>
                      <DialogTitle className="font-display uppercase tracking-wide text-2xl">
                        {isFull ? '加入候補' : '報名確認與付款'}
                      </DialogTitle>
                      <DialogDescription>
                        報名費由平台暫時代存，活動完結後才會發放給搞手。
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="bg-black/30 p-4 rounded-xl space-y-3 my-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">報名費</span>
                        <span>${event.fee.toFixed(2)}</span>
                      </div>
                      {event.fee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">平台手續費 (4%)</span>
                          <span>${(event.fee * 0.04).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="h-px bg-border my-2"></div>
                      <div className="flex justify-between font-bold text-lg text-primary">
                        <span>總計</span>
                        <span>${(event.fee * (event.fee > 0 ? 1.04 : 1)).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-100 p-3 rounded-xl text-xs space-y-2 leading-relaxed">
                      <div className="flex items-center gap-2 font-bold text-amber-200">
                        <ShieldAlert className="w-4 h-4" /> 報名前請睇清楚
                      </div>
                      <ul className="space-y-1 list-disc list-inside text-amber-100/90">
                        <li>TEAMSPIRIT 只係撮合及代收款平台，並非主辦方。場地安全、人身意外、保險由搞手同參加者自行承擔。</li>
                        <li>足球活動有受傷風險，自願參加，建議自備保險。</li>
                        <li>如果搞手要求私下過數（FPS / 現金）而唔係經平台付款，平台無法保障亦唔負責任何金錢糾紛。</li>
                      </ul>
                      <label className="flex items-center gap-2 pt-1 cursor-pointer">
                        <input type="checkbox" checked={paymentAck} onChange={e => setPaymentAck(e.target.checked)} className="w-4 h-4 accent-primary" />
                        <span>我已閱讀並同意以上條款及<Link href="/terms" className="underline hover:text-amber-50">完整免責聲明</Link></span>
                      </label>
                    </div>

                    <DialogFooter className="mt-4">
                      <Button variant="outline" disabled={isProcessing} onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}>
                        取消
                      </Button>
                      <Button 
                        size="lg" 
                        className="font-bold tracking-wider uppercase" 
                        disabled={isProcessing || !paymentAck} 
                        onClick={() => handleRSVP('attending')}
                      >
                        {isProcessing ? "處理中..." : isFull ? '加入候補' : event.fee > 0 ? `確認付款並報名` : '確認出席'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                )}
              </Dialog>

              <Button size="lg" variant={isDeclined ? "destructive" : "outline"} className="w-full md:w-auto font-bold tracking-widest uppercase h-14 px-8" onClick={() => handleRSVP(isDeclined ? 'none' : 'declined')}>
                {isDeclined ? <><X className="w-5 h-5 mr-2"/> 已缺席</> : '缺席'}
              </Button>

              {isWaitlist && (
                <Button size="lg" variant="outline" className="w-full md:w-auto font-bold tracking-widest uppercase h-14 px-8" onClick={() => handleRSVP('none')}>
                  取消候補
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Pay slot dialog */}
      <Dialog open={!!payOfferId} onOpenChange={(open) => !open && setPayOfferId(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider text-2xl">補位付款</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="text-center text-5xl font-display font-bold text-yellow-400">
              {formatRemaining(remainingMs)}
            </div>
            <p className="text-sm text-center text-muted-foreground">逾時將會自動畀下一位候補</p>
            <div className="bg-black/30 p-3 rounded-xl flex justify-between font-bold">
              <span>應付</span>
              <span className="text-primary">${event.fee.toFixed(2)}</span>
            </div>
            <Button size="lg" className="w-full h-14 font-bold tracking-wider uppercase" onClick={handlePayOffer}>
              Stripe 結帳 (${event.fee})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
