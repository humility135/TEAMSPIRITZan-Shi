import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { MapPin, Clock, Check, X, Minus, Plus, Navigation, Zap, Hourglass, Settings, AlertTriangle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { api, ApiError } from '@/lib/api';
import type { EventComment } from '@/lib/types';
import { safeDate, formatTime, formatDate, formatRemaining, useNow } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

export default function EventDetail() {
  const [, params] = useRoute('/events/:eventId');
  const [, setLocation] = useLocation();
  const { events, users, teams, venues, currentUser, updateEventRSVP, updateMatchStats, acceptEventSlot, payEventSlot, declineEventSlot, cancelEvent, finishEvent } = useAppStore();
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const now = useNow(1000);
  const [payOfferId, setPayOfferId] = useState<string | null>(null);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  const [isFinishing, setIsFinishing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const event = events.find(e => e.id === params?.eventId);
  if (!event) return <div className="p-8 text-center">{t('noMatchesFound')}</div>;

  const commentsQ = useQuery({
    queryKey: ['eventComments', event.id],
    queryFn: () => api<EventComment[]>(`/events/${event.id}/comments`),
    enabled: !!event?.id,
  });
  const comments = commentsQ.data ?? [];
  const commentsForbidden = commentsQ.error instanceof ApiError && commentsQ.error.status === 403;

  // Check if current user is Owner or Admin of the team
  const myRole = currentUser.role?.[event.teamId];
  const isPast = new Date(event.datetime).getTime() < Date.now();
  const canManage = (myRole === 'Owner' || myRole === 'Admin') && event.status !== 'cancelled';

  const isAttending = event.attendingIds.includes(currentUser.id);
  const isDeclined = event.declinedIds.includes(currentUser.id);
  const isWaitlist = event.waitlistIds.includes(currentUser.id);
  const waitlistPos = event.waitlistIds.indexOf(currentUser.id) + 1;

  const isFinished = event.status === 'finished';
  const hasCap = event.capacity != null;
  const isFull = hasCap && event.attendingIds.length >= (event.capacity as number);
  const venue = event.venueId ? venues.find(v => v.id === event.venueId) : undefined;
  const baseVenueLabel = lang === 'en' ? (venue?.nameEn ?? event.venueAddressEn ?? event.venueAddress ?? '—') : (venue?.name ?? event.venueAddress ?? '—');
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
  const mapsUrl = venueLabel !== '—' ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueLabel)}` : '';

  const myOffer = event.slotOffers.find(o => o.eligibleUserIds.includes(currentUser.id) || o.acceptedBy === currentUser.id);
  const acceptedByMe = myOffer?.acceptedBy === currentUser.id;
  const deadlineMs = myOffer?.paymentDeadline ? new Date(myOffer.paymentDeadline).getTime() : null;
  const remainingMs = deadlineMs != null ? deadlineMs - now : 0;

  const handleRSVP = (status: 'attending' | 'declined' | 'none') => {
    setRsvpOpen(false);
    setDeclineOpen(false);
    updateEventRSVP(event.id, status);
    if (status === 'attending' && isFull && !isAttending) toast.info(t('waitlistNote'));
  };

  const handleAcceptOffer = async () => {
    if (!myOffer) return;
    const { needPayment } = await acceptEventSlot(event.id, myOffer.id);
    if (needPayment) setPayOfferId(myOffer.id);
    else toast.success(t('slotAutoFilled'));
  };

  const handlePayOffer = async () => {
    if (!payOfferId) return;
    const r = await payEventSlot(event.id, payOfferId);
    setPayOfferId(null);
    if (r.ok) toast.success(t('eventDetailPaymentSuccess'));
    else if (r.reason === 'expired') toast.error(t('eventDetailOfferExpired'));
    else if (r.reason === 'full') toast.error(t('eventDetailFullCannotFill'));
    else toast.error(t('eventDetailPaymentFailed'));
  };

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text) { toast.error(t('commentPlaceholder')); return; }
    if (text.length > 1000) { toast.error(t('commentTooLong')); return; }
    setCommentSending(true);
    try {
      await api(`/events/${event.id}/comments`, { method: 'POST', body: JSON.stringify({ text }) });
      setCommentText('');
      await qc.invalidateQueries({ queryKey: ['eventComments', event.id] });
    } catch (e: any) {
      toast.error(e?.message || t('processing'));
    } finally {
      setCommentSending(false);
    }
  };

  const handleDeclineOffer = async () => {
    if (!myOffer) return;
    await declineEventSlot(event.id, myOffer.id);
    toast.info(t('declineOffer'));
  };

  const handleCancelEvent = async () => {
    setIsCancelling(true);
    try {
      await cancelEvent(event.id);
      toast.success(t('matchCancelled'));
      setCancelOpen(false);
      setManageOpen(false);
    } catch (e: any) {
      toast.error(e.message || t('eventDetailCancelFailed'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleFinishMatch = async () => {
    setIsFinishing(true);
    try {
      await finishEvent(event.id, { home: Number(homeScore), away: Number(awayScore) });
      toast.success(t('confirmFinish'));
      setFinishOpen(false);
      setManageOpen(false);
    } catch (e: any) {
      toast.error(e.message || t('eventDetailFinishFailed'));
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Card */}
      <Card className="overflow-hidden border-border bg-card/50 backdrop-blur relative">
        <div className="p-8 md:p-12 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase border border-primary/20">
                {event.status === 'finished' ? t('statusFinished') : event.status === 'cancelled' ? t('statusCancelled') : t('statusScheduled')}
              </div>
              {event.fee === 0 && <Badge className="bg-green-500/15 text-green-400 border border-green-500/40 text-[10px] tracking-widest uppercase">{t('free')}</Badge>}
              {!hasCap && <Badge className="bg-primary/15 text-primary border border-primary/40 text-[10px] tracking-widest uppercase">{t('spotsUnlimited')}</Badge>}
              {isFull && <Badge className="bg-yellow-500/15 text-yellow-500 border border-yellow-500/40 text-[10px] tracking-widest uppercase">{t('statusFull')}</Badge>}
            </div>

            {canManage && (event.status === 'scheduled' || event.status === 'finished') && (
              <Dialog open={manageOpen} onOpenChange={setManageOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10">
                    <Settings className="w-4 h-4" /> {t('manageEvent')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display uppercase tracking-wider text-2xl">{t('eventDetailManage')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {isPast && event.status === 'scheduled' && (
                      <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-primary flex items-center gap-2">
                              <Check className="w-4 h-4" /> {t('finishMatch')}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{t('finishMatchHint')}</div>
                          </div>
                          <Button onClick={() => setFinishOpen(true)}>{t('finishMatch')}</Button>
                        </div>
                      </div>
                    )}

                    <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-destructive flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> {event.status === 'finished' ? t('deleteMatch') : t('cancelMatch')}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {event.status === 'finished' ? t('deleteMatchConfirmHint') : t('cancelMatchConfirmHint')}
                          </div>
                        </div>
                        <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                          {event.status === 'finished' ? t('deleteMatch') : t('cancelMatch')}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setManageOpen(false)}>{t('close')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">{event.title}</h1>

          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="font-bold text-white text-base">{event.attendingIds.length}</span>{hasCap ? <span>/ {event.capacity}</span> : <span className="text-primary text-xs">{t('unlimited')}</span>}
              {hasCap && <span className="text-xs">{t('spotsRegistered')}</span>}
            </span>
          </div>

          <div className="flex flex-col gap-4 text-muted-foreground">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary shrink-0" />
              <span className="text-lg">
                {formatDate(safeDate(event.datetime), lang === 'en' ? 'en-US' : 'zh-HK')} · {formatTime(event.datetime)}
                {event.endDatetime && <span className="text-muted-foreground whitespace-nowrap"> – {formatTime(event.endDatetime)}</span>}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <div className="text-lg text-white break-words">{venueLabel}</div>
                <div className="text-xs mt-1">{t('navHint')}</div>
              </div>
              {mapsUrl && (
                <Button variant="outline" size="sm" className="bg-white/5 uppercase tracking-wider font-bold text-xs gap-1.5 shrink-0" onClick={() => window.open(mapsUrl, '_blank')}>
                  <Navigation className="w-3.5 h-3.5" /> {t('openMap')}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">$</div>
              <span className="text-lg font-display text-white">{event.fee > 0 ? `$${event.fee} / ${t('pax')}` : t('free')}</span>
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
                    {myOffer.mode === 'race' ? t('raceMode') : t('queueMode')}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {acceptedByMe
                      ? t('offerAcceptedHint')
                      : myOffer.mode === 'race'
                        ? t('offerRaceHint')
                        : t('offerQueueHint')}
                    {acceptedByMe && deadlineMs && (
                      <span className="inline-block ml-1 font-mono font-bold text-yellow-400">{formatRemaining(remainingMs)}</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!acceptedByMe ? (
                    <>
                      <Button size="lg" className="font-bold uppercase tracking-wider bg-yellow-500 hover:bg-yellow-400 text-black" onClick={handleAcceptOffer}>
                        {event.fee > 0 ? `${t('acceptOffer')} ($${event.fee})` : t('acceptOffer')}
                      </Button>
                      <Button size="lg" variant="outline" onClick={handleDeclineOffer}>{t('declineOffer')}</Button>
                    </>
                  ) : (
                    <>
                      <Button size="lg" className="font-bold uppercase tracking-wider bg-primary text-primary-foreground" onClick={() => setPayOfferId(myOffer.id)}>
                        {t('payNow')} (${event.fee})
                      </Button>
                      <Button size="lg" variant="outline" onClick={handleDeclineOffer}>{t('declineOffer')}</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Action Bar */}
      {!isFinished && event.status !== 'cancelled' && (
        <div className="border-t border-border p-4 bg-black/20 space-y-3">
          {isWaitlist && !myOffer && (
            <div className="text-center text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
              {t('joined')} ({t('waitlistRank').replace('{rank}', waitlistPos.toString())})
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {isAttending ? (
              <Button size="lg" variant="default" className="w-full md:w-auto font-bold tracking-widest uppercase h-14 px-8 bg-green-500 text-black hover:bg-green-400">
                <Check className="w-5 h-5 mr-2"/> {t('eventDetailAttended')}
              </Button>
            ) : (
              <Dialog open={rsvpOpen} onOpenChange={setRsvpOpen}>
                <DialogTrigger asChild>
              <Button size="lg" variant="outline" className="w-full md:w-auto font-bold tracking-widest uppercase h-14 px-8">
                {isWaitlist
                  ? t('joined')
                  : isFull
                    ? t('joinWaitlist')
                    : canManage
                      ? t('attendFree')
                      : t('registerNow')}
              </Button>
                </DialogTrigger>
                {!isWaitlist && (
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-display uppercase tracking-wider text-2xl">
                        {isFull ? t('joinWaitlist') : t('registerConfirm')}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {isFull
                          ? t('waitlistNote')
                          : canManage
                            ? t('confirmAttendFree', { title: event.title })
                            : event.fee > 0 ? t('confirmAttendPaid', { title: event.title, fee: event.fee.toString() }) : t('confirmAttendFreeNoFee', { title: event.title })}
                      </p>
                      <Button size="lg" className="w-full h-14 font-bold tracking-wider uppercase" onClick={() => handleRSVP('attending')}>
                        {isFull ? t('joinWaitlist') : canManage ? t('confirmAttending') : t('confirmPayment')}
                      </Button>
                    </div>
                  </DialogContent>
                )}
              </Dialog>
            )}

            {isDeclined ? (
              <Button size="lg" variant="destructive" className="w-full md:w-auto font-bold tracking-widest uppercase h-14 px-8" onClick={() => handleRSVP('none')}>
                <X className="w-5 h-5 mr-2"/> {t('eventsAbsent')}
              </Button>
            ) : (
              <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline" className="w-full md:w-auto font-bold tracking-widest uppercase h-14 px-8">
                    {t('declineMatch')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display uppercase tracking-wider text-2xl">{t('declineConfirmHeader')}</DialogTitle>
                  </DialogHeader>
                  <div className="py-6 space-y-4">
                    <p className="text-sm text-muted-foreground">{t('declineConfirmBody', { title: event.title })}</p>
                    <div className="flex gap-3">
                      <Button size="lg" variant="destructive" className="flex-1 h-12 font-bold tracking-wider uppercase" onClick={() => handleRSVP('declined')}>
                        {t('confirmCancel')}
                      </Button>
                      <Button size="lg" variant="outline" className="flex-1 h-12 font-bold tracking-wider uppercase" onClick={() => setDeclineOpen(false)}>
                        {t('notCancel')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {isWaitlist && (
              <Button size="lg" variant="outline" className="w-full md:w-auto font-bold tracking-widest uppercase h-14 px-8" onClick={() => handleRSVP('none')}>
                {t('leaveWaitlist')}
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>

      {/* Finish Event Dialog */}
      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider text-2xl text-center">{t('scoreReport')}</DialogTitle>
          </DialogHeader>
          <div className="py-8 space-y-8">
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('home')}</div>
                <input
                  type="number"
                  value={homeScore}
                  onChange={e => setHomeScore(e.target.value)}
                  className="w-20 h-20 text-4xl font-display font-bold text-center bg-black/40 rounded-2xl border border-border focus:border-primary outline-none"
                />
              </div>
              <div className="text-4xl font-display font-bold text-muted-foreground mt-6">-</div>
              <div className="flex flex-col items-center gap-2">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('away')}</div>
                <input
                  type="number"
                  value={awayScore}
                  onChange={e => setAwayScore(e.target.value)}
                  className="w-20 h-20 text-4xl font-display font-bold text-center bg-black/40 rounded-2xl border border-border focus:border-primary outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">{t('postMatchHint')}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFinishOpen(false)} disabled={isFinishing}>{t('notCancel')}</Button>
            <Button onClick={handleFinishMatch} disabled={isFinishing} className="font-bold tracking-wide uppercase">{t('confirmFinish')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay slot dialog */}
      <Dialog open={!!payOfferId} onOpenChange={(open) => !open && setPayOfferId(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider text-2xl">{t('payNow')}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="text-center text-5xl font-display font-bold text-yellow-400">
              {formatRemaining(remainingMs)}
            </div>
            <p className="text-sm text-center text-muted-foreground">{t('payDeadlineHint')}</p>
            <div className="bg-black/30 p-3 rounded-xl flex justify-between font-bold">
              <span>{t('payDue')}</span>
              <span className="text-primary">${event.fee.toFixed(2)}</span>
            </div>
            <Button size="lg" className="w-full h-14 font-bold tracking-wider uppercase" onClick={handlePayOffer}>
              {t('stripeCheckout')} (${event.fee})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Match Scoreboard & Admin Panel */}
      {isFinished && (
        <div className="space-y-6">
          <Card className="p-8 border-border bg-card/50 backdrop-blur text-center">
            <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-4">{t('scoreReport')}</h2>
            <div className="flex items-center justify-center gap-8 md:gap-16">
              <div className="text-3xl md:text-5xl font-display font-bold">{t('home')}</div>
              <div className="text-6xl md:text-8xl font-display font-bold text-primary tracking-tighter">
                {event.finalScore?.home} <span className="text-4xl text-muted-foreground">-</span> {event.finalScore?.away}
              </div>
              <div className="text-3xl md:text-5xl font-display font-bold">{t('away')}</div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card/50 backdrop-blur">
            <h2 className="text-xl font-display font-bold uppercase tracking-wide mb-6">{t('matchStatsAdmin')}</h2>
            <div className="space-y-4">
              {event.attendingIds.map(id => {
                const u = users.find(x => x.id === id);
                const stat = event.playerStats.find(s => s.userId === id) || { goals: 0, assists: 0, yellow: 0, red: 0 };
                return (
                  <div key={id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <Avatar><AvatarImage src={u?.avatarUrl || `https://i.pravatar.cc/150?u=${id}`} /></Avatar>
                      <span className="font-bold">{u?.name || id}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <StatCounter label={t('goalsLabel')} value={stat.goals} onMinus={() => updateMatchStats(event.id, id, 'goals', -1)} onPlus={() => updateMatchStats(event.id, id, 'goals', 1)} />
                      <StatCounter label={t('assistsLabel')} value={stat.assists} onMinus={() => updateMatchStats(event.id, id, 'assists', -1)} onPlus={() => updateMatchStats(event.id, id, 'assists', 1)} />
                      
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
      {!isFinished && event.status !== 'cancelled' && (
        <div className={`grid gap-8 ${event.waitlistIds.length > 0 ? 'md:grid-cols-2' : ''}`}>
          <div className="space-y-4">
            <h3 className="text-xl font-display font-bold uppercase flex items-center justify-between">
              {t('attendeesList')} <span className="text-primary">{event.attendingIds.length}{hasCap ? `/${event.capacity}` : ''}</span>
            </h3>
            <Card className="border-border bg-card/50 backdrop-blur p-4">
              {event.attendingIds.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t('eventDetailNoAttendees')}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {event.attendingIds.map(id => {
                    const u = users.find(x => x.id === id);
                    return (
                      <Avatar key={id} className="w-12 h-12 ring-2 ring-primary">
                        <AvatarImage src={u?.avatarUrl || `https://i.pravatar.cc/150?u=${id}`} />
                      </Avatar>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {event.waitlistIds.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-display font-bold uppercase flex items-center justify-between text-muted-foreground">
                {t('eventDetailWaitlist')} <span>{event.waitlistIds.length}</span>
              </h3>
              <Card className="border-border bg-card/50 backdrop-blur p-4">
                <div className="space-y-2">
                  {event.waitlistIds.map((id, index) => {
                    const u = users.find(x => x.id === id);
                    return (
                      <div key={id} className="flex items-center gap-3">
                        <div className="w-6 text-center font-display font-bold text-muted-foreground">{index + 1}</div>
                        <Avatar className="w-8 h-8"><AvatarImage src={u?.avatarUrl || `https://i.pravatar.cc/150?u=${id}`} /></Avatar>
                        <span className="text-sm font-medium">{u?.name || id}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      <Card className="p-6 border-border bg-card/50 backdrop-blur">
        <h3 className="font-bold text-xl mb-6 flex items-center gap-2">{t('commentZone')}</h3>
        {commentsForbidden ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('forbiddenComment')}</p>
        ) : commentsQ.isLoading ? (
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t('noComments')}</p>
              ) : (
                comments.map((comment) => {
                  const u = users.find((x) => x.id === comment.userId);
                  return (
                    <div key={comment.id} className="flex gap-4">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={u?.avatarUrl || `https://i.pravatar.cc/150?u=${comment.userId}`} />
                        <AvatarFallback>{u?.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-sm">{u?.name || comment.userId}</span>
                          <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-HK')}</span>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="pt-6 mt-6 border-t border-border space-y-3">
              <Textarea
                placeholder={t('commentPlaceholder')}
                aria-label={t('commentPlaceholder')}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
                disabled={commentSending}
              />
              <Button className="w-full font-bold uppercase tracking-wider" variant="outline" onClick={handleSendComment} disabled={commentSending || commentsQ.isLoading}>
                {commentSending ? t('processing') : t('sendComment')}
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Admin Cancel Button at the bottom */}
      {canManage && event.status === 'scheduled' && (
        <div className="pt-8 flex justify-center">
          <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30" onClick={() => setCancelOpen(true)}>
            <AlertTriangle className="w-4 h-4 mr-2" /> {t('cancelMatch')}
          </Button>
        </div>
      )}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider text-2xl">{t('cancelMatch')}</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <DialogDescription>{t('cancelEventConfirmHint')}</DialogDescription>
            <div className="flex gap-3">
              <Button size="lg" variant="destructive" className="flex-1 h-12 font-bold tracking-wider uppercase" onClick={handleCancelEvent} disabled={isCancelling}>
                {isCancelling ? t('processing') : t('confirmCancel')}
              </Button>
              <Button size="lg" variant="outline" className="flex-1 h-12 font-bold tracking-wider uppercase" onClick={() => setCancelOpen(false)} disabled={isCancelling}>
                {t('notCancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCounter({ label, value, onMinus, onPlus }: { label: string; value: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground w-12">{label}</div>
      <Button size="icon" variant="outline" className="w-8 h-8 rounded-full" onClick={onMinus}><Minus className="w-3 h-3" /></Button>
      <div className="w-6 text-center font-display font-bold text-xl">{value}</div>
      <Button size="icon" variant="outline" className="w-8 h-8 rounded-full" onClick={onPlus}><Plus className="w-3 h-3" /></Button>
    </div>
  )
}
