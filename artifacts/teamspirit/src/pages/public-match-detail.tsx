import React, { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Star, Info, MessageSquare, AlertTriangle, ShieldCheck, Clock, ExternalLink, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { REFUND_POLICY_OPTIONS } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function PublicMatchDetail() {
  const [, params] = useRoute('/discover/:matchId');
  const { publicMatches, venues, users, hostProfiles, matchComments, currentUser, joinPublicMatch, leavePublicMatch } = useAppStore();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAck, setPaymentAck] = useState(false);

  const openPaymentDialog = () => {
    setPaymentAck(false);
    setShowPaymentDialog(true);
  };
  
  const matchId = params?.matchId;
  const match = publicMatches.find(m => m.id === matchId);
  
  if (!match) {
    return <div className="p-8 text-center">找不到此公開場</div>;
  }

  const venue = match.venueId ? venues.find(v => v.id === match.venueId) : undefined;
  const venueLabel = venue?.name ?? match.venueAddress ?? '—';
  const districtLabel = venue?.district ?? '搵手填地址';
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.venueAddress ?? venue?.name ?? '')}`;
  const host = users.find(u => u.id === match.hostId);
  const hostProfile = hostProfiles.find(p => p.userId === match.hostId);
  const comments = matchComments.filter(c => c.matchId === match.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const refundOpt = REFUND_POLICY_OPTIONS.find(o => o.value === match.refundPolicy);

  const isHost = currentUser.id === match.hostId;
  const isAttending = match.attendees.includes(currentUser.id);
  const cap = match.maxPlayers;
  const isFull = cap != null && match.attendees.length >= cap;
  
  const handleJoin = () => {
    setIsProcessing(true);
    setTimeout(() => {
      joinPublicMatch(match.id);
      setIsProcessing(false);
      setShowPaymentDialog(false);
      toast.success("報名成功！");
    }, 1500);
  };

  const handleLeave = () => {
    leavePublicMatch(match.id);
    toast.info("已取消報名。");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden border border-border group">
        <img src="/src/assets/images/venue-street.png" alt={venue?.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/50 tracking-widest uppercase">公開場</Badge>
              {match.isVerified && <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50 tracking-widest uppercase flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> 已驗證</Badge>}
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tight">{venueLabel}</h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {districtLabel}
              <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                <ExternalLink className="w-3 h-3" /> 開地圖
              </a>
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
                    <span className="flex items-center gap-1 text-yellow-500"><Star className="w-3 h-3 fill-yellow-500" /> {hostProfile?.averageRating.toFixed(1) || 'N/A'}</span>
                    <span>•</span>
                    <span>主辦過 {hostProfile?.hostedCount || 0} 場</span>
                    <span>•</span>
                    <span>準時率 {hostProfile?.punctualityRate || 100}%</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">聯絡搞手</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">日期</div>
                <div className="font-bold">{new Date(match.datetime).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric', weekday: 'short' })}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">時間</div>
                <div className="font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {new Date(match.datetime).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  {match.endDatetime && (
                    <span className="text-muted-foreground"> – {new Date(match.endDatetime).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">場地</div>
                <div className="font-bold">{match.surface === 'hard' ? '硬地' : match.surface === 'turf' ? '仿真草' : '草地'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">水平要求</div>
                <div className="font-bold">{match.skillLevel}★</div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-border">
              <div>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Info className="w-5 h-5 text-primary" /> 描述</h3>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{match.description}</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-primary" /> 規則與退款</h3>
                <div className="bg-black/20 p-4 rounded-xl space-y-2">
                  <p className="text-sm"><span className="font-bold">規則：</span>{match.rules}</p>
                  <p className="text-sm">
                    <span className="font-bold">退款政策：</span>
                    {refundOpt ? `${refundOpt.label} — ${refundOpt.description}` : String(match.refundPolicy)}
                  </p>
                  <p className="text-[11px] text-muted-foreground pt-1 border-t border-border">
                    平台只係撮合工具，活動安全、保險同人身意外責任由搞手同參加者自行承擔。
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border bg-card/50 backdrop-blur">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              已報名名單 ({match.attendees.length}{cap != null ? `/${cap}` : ' · 不設上限'})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {match.attendees.map((attendeeId, i) => {
                const u = users.find(user => user.id === attendeeId);
                return (
                  <div key={i} className="flex flex-col items-center gap-2 p-3 bg-black/20 rounded-xl border border-border/50">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={u?.avatarUrl} />
                      <AvatarFallback>{u?.name?.[0] || 'G'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-bold truncate w-full text-center">{u?.name || `Guest ${i+1}`}</span>
                  </div>
                );
              })}
              {cap != null && Array.from({ length: Math.max(0, cap - match.attendees.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="flex flex-col items-center gap-2 p-3 border border-dashed border-border/50 rounded-xl opacity-50">
                  <div className="w-12 h-12 rounded-full border border-dashed border-border flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">空</span>
                  </div>
                  <span className="text-sm text-muted-foreground">虛位以待</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-border bg-card/50 backdrop-blur">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> 留言區
            </h3>
            <div className="space-y-6">
              {comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">暫時未有留言。</p>
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
                          <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-border bg-card/50 backdrop-blur sticky top-24">
            <div className="text-center mb-6">
              <div className="text-sm text-muted-foreground font-bold tracking-wider uppercase mb-2">報名費</div>
              <div className="text-5xl font-display font-bold text-primary">${match.fee}</div>
              <div className="text-xs text-muted-foreground mt-2">+ ${(match.fee * 0.04).toFixed(1)} 平台手續費 (4%)</div>
            </div>

            {isHost ? (
              <div className="space-y-3">
                <Button className="w-full font-bold uppercase tracking-wider" variant="outline">管理名單</Button>
                <Button className="w-full font-bold uppercase tracking-wider bg-destructive text-destructive-foreground hover:bg-destructive/90">取消此公開場</Button>
              </div>
            ) : isAttending ? (
              <div className="space-y-4">
                <div className="bg-primary/20 text-primary p-4 rounded-xl text-center font-bold">
                  ✓ 你已成功報名
                </div>
                <Button className="w-full font-bold uppercase tracking-wider" variant="outline" onClick={handleLeave}>取消報名</Button>
              </div>
            ) : isFull ? (
              <Button className="w-full font-bold uppercase tracking-wider h-14 text-lg" disabled>已滿額</Button>
            ) : (
              <Button 
                className="w-full font-bold uppercase tracking-wider h-14 text-lg animate-pulse hover:animate-none" 
                onClick={openPaymentDialog}
              >
                我要報名
              </Button>
            )}

            <div className="mt-6 pt-6 border-t border-border flex justify-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                <AlertTriangle className="w-4 h-4 mr-2" /> 舉報此場地
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wide text-2xl">報名確認與付款</DialogTitle>
            <DialogDescription>
              報名費由平台暫時代存，活動完結後才會發放給搞手。
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-black/30 p-4 rounded-xl space-y-3 my-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">報名費</span>
              <span>${match.fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">平台手續費 (4%)</span>
              <span>${(match.fee * 0.04).toFixed(2)}</span>
            </div>
            <div className="h-px bg-border my-2"></div>
            <div className="flex justify-between font-bold text-lg text-primary">
              <span>總計</span>
              <span>${(match.fee * 1.04).toFixed(2)}</span>
            </div>
          </div>

          {refundOpt && (
            <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl text-xs space-y-1">
              <div className="font-bold text-primary">退款政策：{refundOpt.label}</div>
              <p className="text-muted-foreground leading-relaxed">{refundOpt.description}</p>
            </div>
          )}

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

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={isProcessing}>取消</Button>
            <Button onClick={handleJoin} disabled={isProcessing || !paymentAck} className="font-bold">
              {isProcessing ? "處理中..." : "確認付款並報名"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}