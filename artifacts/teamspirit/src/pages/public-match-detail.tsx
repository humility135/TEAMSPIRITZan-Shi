import React, { useState, useEffect } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  MapPin, Calendar, Users, Star, Info, MessageSquare, 
  AlertTriangle, ShieldCheck, Clock, ExternalLink, 
  ShieldAlert, Zap, Hourglass, Share2 
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { detectDistrict } from '@/lib/districts';
import { safeDate, formatTime, formatDate } from '@/lib/utils';
import { REFUND_POLICY_OPTIONS } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { districtTranslations } from '@/lib/districts';

function formatRemaining(ms: number) {
  if (ms <= 0) return '00:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function PublicMatchDetail() {
  const [location, setLocation] = useLocation();
  const [, params] = useRoute('/discover/:matchId');
  const { publicMatches, venues, users, hostProfiles, matchComments, currentUser, joinPublicMatch, leavePublicMatch, acceptMatchSlot, payMatchSlot, declineMatchSlot, cancelPublicMatch, finishPublicMatch, addMatchComment } = useAppStore();
  const { t, lang } = useI18n();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAck, setPaymentAck] = useState(false);
  const [slotPayOpen, setSlotPayOpen] = useState(false);
  const [slotAck, setSlotAck] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [finishOpen, setFinishOpen] = useState(false);
  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  const [isFinishing, setIsFinishing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const action = params.get('action');
    if (action === 'finish') setFinishOpen(true);
    if (action === 'cancel') setCancelOpen(true);
  }, []);

  const openPaymentDialog = () => {
    setPaymentAck(false);
    setShowPaymentDialog(true);
  };

  const matchId = params?.matchId;
  const match = publicMatches.find(m => m.id === matchId);

  if (!match) {
    return <div className="p-8 text-center">{t('noMatchesFound')}</div>;
  }
  
  // Safe date parser to handle invalid dates from old mock data
  const matchDate = match.datetime;
  const matchEndDate = match.endDatetime;

  const venue = match.venueId ? venues.find(v => v.id === match.venueId) : undefined;
  const venueLabel = lang === 'en' ? (venue?.nameEn ?? match.venueAddress ?? '—') : (venue?.name ?? match.venueAddress ?? '—');
  const districtLabel = lang === 'en' ? (venue?.districtEn ?? (match.venueAddress ? districtTranslations[detectDistrict(match.venueAddress)] : t('other'))) : (venue?.district ?? (match.venueAddress ? detectDistrict(match.venueAddress) : t('other')));
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venueLabel} ${lang === 'en' ? 'Hong Kong' : '香港'} ${districtLabel}`)}`;
  const host = users.find(u => u.id === match.hostId);
  const hostProfile = hostProfiles.find(p => p.userId === match.hostId);
  const comments = matchComments.filter(c => c.matchId === match.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const refundOpt = REFUND_POLICY_OPTIONS.find(o => o.value === match.refundPolicy);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${venueLabel} · ${t('publicMatch')}`;

    const navAny = navigator as any;
    if (typeof navAny?.share === 'function') {
      try {
        await navAny.share({ title, url });
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      }
    }

    try {
      await navAny?.clipboard?.writeText?.(url);
      toast.success(t('copyLinkSuccess'));
    } catch {
      window.prompt(t('copyLink'), url);
    }
  };

  const isHost = currentUser.id === match.hostId;
  const isAttending = match.attendees.includes(currentUser.id);
  const isPast = safeDate(match.endDatetime ?? match.datetime).getTime() < now;
  const isWaitlist = match.waitlistIds.includes(currentUser.id);
  const waitlistPos = match.waitlistIds.indexOf(currentUser.id) + 1;
  const cap = match.maxPlayers;
  const isFull = cap != null && match.attendees.length >= cap;

  const myOffer = match.slotOffers.find(o => o.eligibleUserIds.includes(currentUser.id) || o.acceptedBy === currentUser.id);
  const acceptedByMe = myOffer?.acceptedBy === currentUser.id;
  const deadlineMs = myOffer?.paymentDeadline ? new Date(myOffer.paymentDeadline).getTime() : null;
  const remainingMs = deadlineMs != null ? deadlineMs - now : 0;

  const handleJoin = () => {
    setIsProcessing(true);
    setTimeout(async () => {
      try {
        await joinPublicMatch(match.id);
        toast.success(t('confirmPayment')); // Reuse or specific success
      } catch (e: any) {
        toast.error(e.message || t('processing'));
      } finally {
        setIsProcessing(false);
        setShowPaymentDialog(false);
      }
    }, 1500);
  };

  const handleJoinWaitlist = async () => {
    try {
      await joinPublicMatch(match.id);
      toast.success(t('waitlistNote'));
    } catch (e: any) {
      toast.error(e.message || t('publicMatchJoinWaitlistFailed'));
    }
  };

  const handleLeave = async () => {
    try {
      await leavePublicMatch(match.id);
      toast.info(isAttending ? t('cancelRegistration') : t('leaveWaitlist'));
    } catch (e: any) {
      toast.error(e.message || t('processing'));
    } finally {
      setLeaveOpen(false);
    }
  };

  const handleSendComment = async () => {
    const text = commentText.trim();
    if (!text) { toast.error(t('publicMatchCommentEmpty')); return; }
    if (text.length > 1000) { toast.error(t('publicMatchCommentTooLong')); return; }
    setCommentSending(true);
    try {
      await addMatchComment(match.id, text);
      setCommentText('');
    } catch (e: any) {
      toast.error(e?.message || t('publicMatchSendFailed'));
    } finally {
      setCommentSending(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!myOffer) return;
    const { needPayment } = await acceptMatchSlot(match.id, myOffer.id);
    if (needPayment) {
      setSlotAck(false);
      setSlotPayOpen(true);
    } else {
      toast.success(t('eventDetailSlotAutoFilled'));
    }
  };

  const handlePaySlot = async () => {
    if (!myOffer) return;
    const r = await payMatchSlot(match.id, myOffer.id);
    setSlotPayOpen(false);
    if (r.ok) toast.success(t('eventDetailPaymentSuccess'));
    else if (r.reason === 'expired') toast.error(t('publicMatchOfferExpired'));
    else if (r.reason === 'full') toast.error(t('publicMatchFullCannotFill'));
    else toast.error(t('publicMatchPaymentFailed'));
  };

  const handleDeclineOffer = async () => {
    if (!myOffer) return;
    await declineMatchSlot(match.id, myOffer.id);
    toast.info(t('publicMatchDeclined'));
  };

  const handleCancelMatch = async () => {
    setIsCancelling(true);
    try {
      await cancelPublicMatch(match.id);
      toast.success(t('matchCancelled'));
      setCancelOpen(false);
    } catch (e: any) {
      toast.error(e.message || t('publicMatchCancelFailed'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleFinishPublicMatch = async () => {
    setIsFinishing(true);
    try {
      await finishPublicMatch(match.id, { home: Number(homeScore), away: Number(awayScore) });
      toast.success(t('confirmFinish'));
      setFinishOpen(false);
    } catch (e: any) {
      toast.error(e.message || t('publicMatchFinishFailed'));
    } finally {
      setIsFinishing(false);
    }
  };

  const handleManageList = () => {
    setLocation(`/manage-match/${match.id}`);
  };

  const handleReport = () => {
    toast.success(t('reportSuccess'));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden border border-border group">
        <img src="/src/assets/images/venue-street.png" alt={venue?.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/50 tracking-widest uppercase">{t('publicMatch')}</Badge>
              {match.isVerified && <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50 tracking-widest uppercase flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {t('registered')}</Badge>}
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tight">{venueLabel}</h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {districtLabel}
              <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                <ExternalLink className="w-3 h-3" /> {t('openMap')}
              </a>
              <button
                type="button"
                aria-label={t('publicMatchShare')}
                onClick={handleShare}
                className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
              >
                <Share2 className="w-3 h-3" /> {t('share')}
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card className="p-6 border-border bg-card/50 backdrop-blur space-y-6">
            <div className="flex justify-between items-center pb-6 border-b border-border">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border border-border">
                  <AvatarImage src={host?.avatarUrl} />
                  <AvatarFallback>{host?.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-lg">{host?.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center gap-1 text-yellow-500"><Star className="w-3 h-3 fill-yellow-500" /> {hostProfile?.averageRating != null ? hostProfile.averageRating.toFixed(1) : 'N/A'}</span>
                    <span>•</span>
                    <span>{t('hostedCount')} {hostProfile?.hostedCount || 0} {t('hostedCountLabel')}</span>
                    <span>•</span>
                    <span>{t('punctuality')} {hostProfile?.punctualityRate || 100}%</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">{t('contactHost')}</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('date')}</div>
                <div className="font-bold">{formatDate(matchDate, lang === 'en' ? 'en-US' : 'zh-HK')}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('time')}</div>
                <div className="font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {formatTime(matchDate)}
                  {matchEndDate && (
                    <span className="text-muted-foreground"> – {formatTime(matchEndDate)}</span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('venue')}</div>
                <div className="font-bold">{match.surface === 'hard' ? t('surfaceHard') : match.surface === 'turf' ? t('surfaceTurf') : t('surfaceGrass')}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('skillLevelReq')}</div>
                <div className="font-bold">{match.skillLevel}★</div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-border">
              <div>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Info className="w-5 h-5 text-primary" /> {t('description')}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{match.description}</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-primary" /> {t('rulesAndNotes')}</h3>
                <div className="bg-black/20 p-4 rounded-xl space-y-2">
                  <p className="text-sm"><span className="font-bold">{t('rulesLabel')}</span>{match.rules}</p>
                  <p className="text-[11px] text-muted-foreground pt-1 border-t border-border">
                    {t('liabilityNote')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card/50 backdrop-blur">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {t('attendeesList')} ({match.attendees.length}{cap != null ? `/${cap}` : ` · ${t('spotsUnlimited')}`})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {match.attendees.map((attendeeId, i) => {
                const u = users.find(user => user.id === attendeeId);
                return (
                  <div key={attendeeId} className="flex flex-col items-center gap-2 p-3 bg-black/20 rounded-xl border border-border/50">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={u?.avatarUrl} />
                      <AvatarFallback>{u?.name?.[0] || 'G'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-bold truncate w-full text-center">{u?.name || `${t('guest')} ${i+1}`}</span>
                  </div>
                );
              })}
              {cap != null && Array.from({ length: Math.max(0, cap - match.attendees.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex flex-col items-center gap-2 p-3 border border-dashed border-border/50 rounded-xl opacity-50">
                    <div className="w-12 h-12 rounded-full border border-dashed border-border flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">{t('publicMatchEmpty')}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{t('emptySlot')}</span>
                  </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-border bg-card/50 backdrop-blur">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> {t('commentZone')}
            </h3>
            <div className="space-y-6">
              {comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t('noComments')}</p>
              ) : (
                comments.map(comment => {
                  const u = users.find(user => user.id === comment.userId);
                  return (
                    <div key={comment.id} className="flex gap-4">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={u?.avatarUrl} />
                        <AvatarFallback>{u?.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-bold text-sm">{u?.name}</span>
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
              <Button className="w-full font-bold uppercase tracking-wider" variant="outline" onClick={handleSendComment} disabled={commentSending}>
                {commentSending ? t('processing') : t('sendComment')}
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-border bg-card/50 backdrop-blur sticky top-24">
            <div className="text-center mb-6">
              <div className="text-sm text-muted-foreground font-bold tracking-wider uppercase mb-2">{t('fee')}</div>
              <div className="text-5xl font-display font-bold text-primary">${match.fee}</div>
              <div className="text-xs text-muted-foreground mt-2">+ ${(match.fee * 0.04).toFixed(1)} {t('platformFee')} (4%)</div>
            </div>

            {myOffer && !isHost && (
              <div className={`mb-5 p-4 rounded-xl border ${myOffer.mode === 'race' ? 'bg-yellow-500/10 border-yellow-500/40' : 'bg-primary/10 border-primary/40'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {myOffer.mode === 'race' ? <Zap className="w-5 h-5 text-yellow-500" /> : <Hourglass className="w-5 h-5 text-primary" />}
                  <span className="font-display uppercase tracking-wide text-sm font-bold">
                    {myOffer.mode === 'race' ? t('raceMode') : t('queueMode')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {acceptedByMe
                    ? t('offerAcceptedDeadlineHint')
                    : myOffer.mode === 'race'
                      ? t('offerRaceClaimHint')
                      : t('offerQueuePriorityHint')}
                </p>
                {acceptedByMe && deadlineMs && (
                  <div className="text-center text-2xl font-display font-bold text-yellow-400 mb-3">
                    {formatRemaining(remainingMs)}
                  </div>
                )}
                <div className="space-y-2">
                  {!acceptedByMe ? (
                    <Button className="w-full font-bold uppercase tracking-wider bg-yellow-500 hover:bg-yellow-400 text-black" onClick={handleAcceptOffer}>
                      {match.fee > 0 ? `${t('acceptOffer')} ($${match.fee})` : t('acceptOffer')}
                    </Button>
                  ) : (
                    <Button className="w-full font-bold uppercase tracking-wider" onClick={() => { setSlotAck(false); setSlotPayOpen(true); }}>
                      {t('payNow')} (${match.fee})
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="w-full" onClick={handleDeclineOffer}>{t('declineOffer')}</Button>
                </div>
              </div>
            )}

            {isHost ? (
              <div className="space-y-4">
                {match.status === 'cancelled' ? (
                  <div className="bg-destructive/20 text-destructive border border-destructive/30 p-4 rounded-xl text-center font-bold">
                    {t('matchCancelled')}
                  </div>
                ) : !isAttending ? (
                  <Button className="w-full font-bold uppercase tracking-wider h-14 text-lg animate-pulse hover:animate-none" onClick={handleJoin} disabled={isProcessing}>
                    {isProcessing ? t('processing') : t('registerNow')}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-primary/20 text-primary p-4 rounded-xl text-center font-bold">
                      ✓ {t('registered')}
                    </div>
                    <Button className="w-full font-bold uppercase tracking-wider" variant="outline" onClick={() => setLeaveOpen(true)}>{t('cancelRegistration')}</Button>
                  </div>
                )}
                {match.status !== 'cancelled' && match.status !== 'finished' && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    {isPast && (
                      <Button className="w-full font-bold uppercase tracking-wider bg-primary text-primary-foreground" onClick={() => setFinishOpen(true)}>{t('finishMatch')}</Button>
                    )}
                    <Button className="w-full font-bold uppercase tracking-wider" variant="outline" onClick={handleManageList}>{t('manageList')}</Button>
                    <Button className="w-full font-bold uppercase tracking-wider bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => setCancelOpen(true)}>{t('cancelMatch')}</Button>
                  </div>
                )}
              </div>
            ) : match.status === 'cancelled' ? (
              <div className="bg-destructive/20 text-destructive border border-destructive/30 p-4 rounded-xl text-center font-bold">
                {t('matchCancelled')}
              </div>
            ) : isAttending ? (
              <div className="space-y-4">
                <div className="bg-primary/20 text-primary p-4 rounded-xl text-center font-bold">
                  ✓ {t('registered')}
                </div>
                <Button className="w-full font-bold uppercase tracking-wider" variant="outline" onClick={() => setLeaveOpen(true)}>{t('cancelRegistration')}</Button>
              </div>
            ) : isWaitlist ? (
              <div className="space-y-4">
                <div className="bg-amber-500/15 text-amber-200 border border-amber-500/30 p-4 rounded-xl text-center">
                  <div className="font-bold">{t('joined')}</div>
                  <div className="text-xs text-amber-100/80 mt-1">{t('waitlistRank').replace('{rank}', waitlistPos.toString())}</div>
                </div>
                <Button className="w-full font-bold uppercase tracking-wider" variant="outline" onClick={() => setLeaveOpen(true)}>{t('leaveWaitlist')}</Button>
              </div>
            ) : isFull ? (
              <Button
                className="w-full font-bold uppercase tracking-wider h-14 text-lg"
                onClick={handleJoinWaitlist}
              >
                {t('joinWaitlist')} ($0)
              </Button>
            ) : (
              <Button
                className="w-full font-bold uppercase tracking-wider h-14 text-lg animate-pulse hover:animate-none"
                onClick={openPaymentDialog}
              >
                {t('registerNow')}
              </Button>
            )}

            <div className="mt-6 pt-6 border-t border-border flex justify-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={handleReport}>
                <AlertTriangle className="w-4 h-4 mr-2" /> {t('reportVenue')}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wide text-2xl">{t('registerConfirm')}</DialogTitle>
            <DialogDescription>
              {t('paymentNote')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-black/30 p-4 rounded-xl space-y-3 my-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('fee')}</span>
              <span>${match.fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('platformFee')} (4%)</span>
              <span>${(match.fee * 0.04).toFixed(2)}</span>
            </div>
            <div className="h-px bg-border my-2"></div>
            <div className="flex justify-between font-bold text-lg text-primary">
              <span>{t('total')}</span>
              <span>${(match.fee * 1.04).toFixed(2)}</span>
            </div>
          </div>

          {refundOpt && (
            <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl text-xs space-y-1">
              <div className="font-bold text-primary">{t('refundPolicyLabel')}{t(refundOpt.label)}</div>
              <p className="text-muted-foreground leading-relaxed">{t(refundOpt.description)}</p>
            </div>
          )}

          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-100 p-3 rounded-xl text-xs space-y-2 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-amber-200">
              <ShieldAlert className="w-4 h-4" /> {t('securityAlert')}
            </div>
            <ul className="space-y-1 list-disc list-inside text-amber-100/90">
              <li>{t('securityBullet1')}</li>
              <li>{t('securityBullet2')}</li>
              <li>{t('securityBullet3')}</li>
            </ul>
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input type="checkbox" checked={paymentAck} onChange={e => setPaymentAck(e.target.checked)} className="w-4 h-4 accent-primary" />
              <span>{t('agreeTerms')} <Link href="/terms" className="underline hover:text-amber-50">{t('matchDetail')}</Link></span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={isProcessing}>{t('notCancel')}</Button>
            <Button onClick={handleJoin} disabled={isProcessing || !paymentAck} className="font-bold">
              {isProcessing ? t('processing') : t('confirmPayment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wide text-2xl">{t('cancelRegistration')}</DialogTitle>
            <DialogDescription>
              {isAttending ? `${t('confirmCancel')}「${venueLabel}」?` : t('leaveWaitlist')}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveOpen(false)}>{t('notCancel')}</Button>
            <Button variant="destructive" onClick={handleLeave} className="font-bold">
              {t('confirmCancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={slotPayOpen} onOpenChange={setSlotPayOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wide text-2xl">{t('payNow')}</DialogTitle>
            <DialogDescription>{t('paymentNote')}</DialogDescription>
          </DialogHeader>

          {acceptedByMe && deadlineMs && (
            <div className="text-center text-4xl font-display font-bold text-yellow-400 my-2">
              {formatRemaining(remainingMs)}
            </div>
          )}

          <div className="bg-black/30 p-4 rounded-xl space-y-3 my-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('fee')}</span>
              <span>${match.fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('platformFee')} (4%)</span>
              <span>${(match.fee * 0.04).toFixed(2)}</span>
            </div>
            <div className="h-px bg-border my-2"></div>
            <div className="flex justify-between font-bold text-lg text-primary">
              <span>{t('total')}</span>
              <span>${(match.fee * 1.04).toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-100 p-3 rounded-xl text-xs space-y-2 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-amber-200">
              <ShieldAlert className="w-4 h-4" /> {t('securityAlert')}
            </div>
            <ul className="space-y-1 list-disc list-inside text-amber-100/90">
              <li>{t('securityBullet1')}</li>
              <li>{t('securityBullet2')}</li>
            </ul>
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input type="checkbox" checked={slotAck} onChange={e => setSlotAck(e.target.checked)} className="w-4 h-4 accent-primary" />
              <span>{t('agreeTerms')} <Link href="/terms" className="underline hover:text-amber-50">{t('matchDetail')}</Link></span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSlotPayOpen(false)}>{t('notCancel')}</Button>
            <Button onClick={handlePaySlot} disabled={!slotAck} className="font-bold">{t('confirmPayment')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFinishOpen(false)} disabled={isFinishing}>{t('notCancel')}</Button>
            <Button onClick={handleFinishPublicMatch} disabled={isFinishing} className="font-bold tracking-wide uppercase">{t('confirmFinish')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider text-2xl">{t('cancelMatch')}</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <p className="text-sm text-muted-foreground">{t('liabilityNote')}</p>
            <div className="flex gap-3">
              <Button size="lg" variant="destructive" className="flex-1 h-12 font-bold tracking-wider uppercase" onClick={handleCancelMatch} disabled={isCancelling}>
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
