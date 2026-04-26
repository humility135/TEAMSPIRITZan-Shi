import React, { useState, useRef } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { Users, Trophy, Settings, Calendar, MapPin, Camera, Plus, ArrowRight, LogOut, Copy, UserMinus, Shield, ShieldCheck, Crown } from 'lucide-react';
import { useAppStore, getTeamStats } from '@/lib/store';
import { safeDate, formatTime, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Role, SurfaceType } from '@/lib/types';
import { ShieldAlert } from 'lucide-react';

const ACCENT_COLORS = ['#84cc16', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#10b981'];

export default function TeamDetail() {
  const [, params] = useRoute('/teams/:teamId');
  const [, navigate] = useLocation();
  const { teams, users, events, venues, currentUser, updateTeam, leaveTeam, deleteTeam, removeMember, setMemberRole, createEvent } = useAppStore();
  const { toast } = useToast();

  const team = teams.find(t => t.id === params?.teamId);
  const [manageOpen, setManageOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [name, setName] = useState(team?.name || '');
  const [accentColor, setAccentColor] = useState(team?.accentColor || ACCENT_COLORS[0]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // create event form state
  const [evTitle, setEvTitle] = useState('');
  const [evDate, setEvDate] = useState('');
  const [evStart, setEvStart] = useState('');
  const [evEnd, setEvEnd] = useState('');
  const [evAddress, setEvAddress] = useState('');
  const [evSurface, setEvSurface] = useState<SurfaceType>('hard');
  const [evSkill, setEvSkill] = useState<number>(3);
  const [evFee, setEvFee] = useState('');
  const [evCap, setEvCap] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evRules, setEvRules] = useState('');
  const [evAck, setEvAck] = useState(false);

  const resetEventForm = () => {
    setEvTitle(''); setEvDate(''); setEvStart(''); setEvEnd(''); setEvAddress('');
    setEvSurface('hard'); setEvSkill(3); setEvFee(''); setEvCap('');
    setEvDesc(''); setEvRules(''); setEvAck(false);
  };

  if (!team) return <div className="p-8 text-center">Team not found</div>;

  const role: Role | undefined = currentUser.role[team.id];
  const isMember = team.memberIds.includes(currentUser.id);
  const isOwner = role === 'Owner';
  const isAdmin = role === 'Admin';
  const canManage = isOwner || isAdmin;

  const teamEvents = events.filter(e => e.teamId === team.id);
  const upcomingEvents = teamEvents.filter(e => e.status === 'scheduled').sort((a, b) => safeDate(a.datetime).getTime() - safeDate(b.datetime).getTime());
  const pastEvents = teamEvents.filter(e => e.status === 'finished' || e.status === 'cancelled').sort((a, b) => safeDate(b.datetime).getTime() - safeDate(a.datetime).getTime());

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: '圖片太大', description: 'Logo 上限 2MB', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateTeam(team.id, {
      name: name.trim() || team.name,
      accentColor,
      ...(logoPreview ? { logoUrl: logoPreview } : {})
    });
    setManageOpen(false);
    setLogoPreview(null);
    toast({ title: '球隊資料已更新' });
  };

  const handleLeave = async () => {
    try {
      const res = await leaveTeam(team.id);
      if (res && res.error) {
        toast({ title: '無法退出', description: res.error, variant: 'destructive' });
        setLeaveOpen(false);
        return;
      }
      setLeaveOpen(false);
      toast({ title: res && res.deleted ? '球隊已解散' : '已退出球隊', description: team.name });
      navigate('/teams');
    } catch (e: any) {
      // Fallback for network or unexpected 500 errors
      const errorMsg = e?.body?.error || e.message || '發生未知錯誤，請重試。';
      toast({ title: '退出失敗', description: errorMsg, variant: 'destructive' });
      setLeaveOpen(false);
    }
  };

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam(team.id);
      setLeaveOpen(false);
      toast({ title: '球隊已解散', description: team.name });
      navigate('/teams');
    } catch (e: any) {
      toast({ title: '解散失敗', description: e.message || '無法解散球隊', variant: 'destructive' });
    }
  };

  const handleKick = async (userId: string, userName: string) => {
    try {
      await removeMember(team.id, userId);
      toast({ title: '已移除成員', description: userName });
    } catch (e: any) {
      toast({ title: '移除失敗', description: e.message || '發生錯誤', variant: 'destructive' });
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await setMemberRole(team.id, userId, newRole);
      toast({ title: '角色已更新' });
    } catch (e: any) {
      toast({ title: '更新失敗', description: e.message || '發生錯誤', variant: 'destructive' });
    }
  };

  const handleCopyInvite = () => {
    if (!team.inviteCode) return;
    navigator.clipboard.writeText(team.inviteCode);
    toast({ title: '邀請碼已複製', description: team.inviteCode });
  };

  const handleCreateEvent = () => {
    if (!evTitle.trim()) { toast({ title: '請輸入活動名稱', variant: 'destructive' }); return; }
    if (!evDate || !evStart || !evEnd) { toast({ title: '請填妥日期、開始同完結時間', variant: 'destructive' }); return; }
    
    // Check if the date is in the past
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Hong_Kong' });
    if (evDate < todayStr) { toast({ title: '唔可以揀過去嘅日期', variant: 'destructive' }); return; }

    if (!evAddress.trim()) { toast({ title: '請輸入場地地址', variant: 'destructive' }); return; }
    if (evCap.trim() !== '' && (!Number.isInteger(Number(evCap)) || Number(evCap) <= 0)) {
      toast({ title: '人數上限要係大過 0 嘅整數', variant: 'destructive' }); return;
    }
    if (evFee.trim() !== '' && (Number.isNaN(Number(evFee)) || Number(evFee) < 0)) {
      toast({ title: '報名費要係 0 或正數', variant: 'destructive' }); return;
    }
    if (evDesc.trim().length < 10) { toast({ title: '活動描述至少 10 個字', variant: 'destructive' }); return; }
    if (evRules.trim().length < 5) { toast({ title: '請填寫特別規則', variant: 'destructive' }); return; }
    if (!evAck) { toast({ title: '請確認免責聲明', variant: 'destructive' }); return; }
    
    // Explicitly use HK timezone to prevent browser auto-conversion
    const startDateTimeStr = `${evDate}T${evStart}:00+08:00`;
    const startDateTime = new Date(startDateTimeStr);
    
    let endDateTimeStr = `${evDate}T${evEnd}:00+08:00`;
    let endDateTime = new Date(endDateTimeStr);
    
    // Handle overnight events (e.g. 23:00 to 01:00)
    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }
    
    createEvent({
      teamId: team.id,
      title: evTitle.trim(),
      datetime: startDateTime.toISOString(),
      endDatetime: endDateTime.toISOString(),
      venueAddress: evAddress.trim(),
      surface: evSurface,
      skillLevel: evSkill,
      fee: evFee.trim() === '' ? 0 : Number(evFee),
      capacity: evCap.trim() === '' ? null : Number(evCap),
      description: evDesc.trim(),
      rules: evRules.trim(),
    });
    setCreateEventOpen(false);
    resetEventForm();
    toast({ title: '活動已發起', description: evTitle });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="relative rounded-3xl overflow-hidden bg-card border border-border p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full filter blur-[100px] opacity-20" style={{ backgroundColor: team.accentColor }} />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-black ring-4 ring-background shadow-2xl shrink-0">
            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                {team.isPro && (
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-3 text-black" style={{ backgroundColor: team.accentColor }}>
                    Pro Club
                  </div>
                )}
                <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tight">{team.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground justify-center md:justify-start">
                  {team.district && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{team.district}</span>}
                  {team.level && <span>水平 {'★'.repeat(team.level)}</span>}
                  {role && (
                    <Badge variant="outline" className={`text-[10px] tracking-widest uppercase ${isOwner ? 'border-primary text-primary' : isAdmin ? 'border-blue-400 text-blue-400' : ''}`}>
                      {role.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                {isMember && !canManage && (
                  <Button variant="outline" className="gap-2 text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => setLeaveOpen(true)}>
                    <LogOut className="w-4 h-4" /> 退出球隊
                  </Button>
                )}

                <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{isOwner ? '確定要解散球隊？' : '確定要退出球隊？'}</DialogTitle>
                      <DialogDescription>
                        {isOwner ? '此操作無法復原，所有資料將被永久刪除。' : '退出後你嘅戰績仍然會保留。'}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setLeaveOpen(false)}>取消</Button>
                      <Button variant="destructive" onClick={isOwner ? handleDeleteTeam : handleLeave}>
                        確定{isOwner ? '解散' : '退出'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {canManage && (
                  <Dialog open={manageOpen} onOpenChange={setManageOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10">
                        <Settings className="w-4 h-4" /> 管理球隊
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="font-display uppercase tracking-wider text-2xl">管理球隊</DialogTitle>
                        <DialogDescription>更新球隊資料、管理成員、查閱邀請碼。</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-2">
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-black ring-2 ring-border">
                              <img src={logoPreview || team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                          <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()} className="text-xs text-primary">
                            <Camera className="w-3 h-3 mr-1" /> 更換 Logo
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="t-name">球隊名稱</Label>
                          <Input id="t-name" value={name} onChange={e => setName(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                          <Label>主題色</Label>
                          <div className="flex gap-2 flex-wrap">
                            {ACCENT_COLORS.map(c => (
                              <button
                                key={c}
                                onClick={() => setAccentColor(c)}
                                className={`w-9 h-9 rounded-lg transition-all ${accentColor === c ? 'ring-2 ring-white scale-110' : 'ring-1 ring-border'}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>

                        {team.inviteCode && (
                          <div className="space-y-2">
                            <Label>邀請碼</Label>
                            <div className="flex gap-2">
                              <Input readOnly value={team.inviteCode} className="font-display text-xl tracking-widest text-center" />
                              <Button variant="outline" size="icon" onClick={handleCopyInvite}><Copy className="w-4 h-4" /></Button>
                            </div>
                            <p className="text-xs text-muted-foreground">畀朋友輸入呢個碼就可以申請加入。</p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>成員管理</Label>
                          <div className="rounded-lg border border-border divide-y divide-border">
                            {team.memberIds.map(id => {
                              const u = users.find(x => x.id === id);
                              const memberRole = u?.role[team.id] || 'Member';
                              const isSelf = id === currentUser.id;
                              return (
                                <div key={id} className="p-3 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="w-9 h-9">
                                      <AvatarImage src={u?.avatarUrl || `https://i.pravatar.cc/150?u=${id}`} />
                                      <AvatarFallback>{u?.name?.[0] || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <div className="font-bold truncate">{u?.name || id}{isSelf && ' (你)'}</div>
                                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        {memberRole === 'Owner' && <Crown className="w-3 h-3 text-primary" />}
                                        {memberRole === 'Admin' && <ShieldCheck className="w-3 h-3 text-blue-400" />}
                                        {memberRole === 'Member' && <Shield className="w-3 h-3" />}
                                        {memberRole}
                                      </div>
                                    </div>
                                  </div>
                                  {isOwner && !isSelf && memberRole !== 'Owner' && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Select value={memberRole} onValueChange={(v) => handleRoleChange(id, v as Role)}>
                                        <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Admin">Admin</SelectItem>
                                          <SelectItem value="Member">Member</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:bg-destructive/10" onClick={() => handleKick(id, u?.name || id)}>
                                        <UserMinus className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                  {isAdmin && !isSelf && memberRole === 'Member' && (
                                    <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:bg-destructive/10" onClick={() => handleKick(id, u?.name || id)}>
                                      <UserMinus className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>危險操作</Label>
                          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-4">
                            {isMember && !isOwner && (
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-destructive">退出球隊</div>
                                  <div className="text-xs text-muted-foreground mt-1">退出後你嘅戰績仍然會保留。</div>
                                </div>
                                <Button variant="destructive" onClick={() => { setManageOpen(false); setLeaveOpen(true); }}>退出</Button>
                              </div>
                            )}

                            {isOwner && (
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-destructive">解散球隊</div>
                                  <div className="text-xs text-muted-foreground mt-1">此操作無法復原，所有資料將被永久刪除。</div>
                                </div>
                                <Button variant="destructive" onClick={() => { setManageOpen(false); setLeaveOpen(true); }}>解散</Button>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                      <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => { setManageOpen(false); setLogoPreview(null); setName(team.name); }}>取消</Button>
                        <Button onClick={handleSave} className="font-bold tracking-wide uppercase">儲存</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-8 pt-4">
              <Stat label="戰績" value={`${team.record.w}W ${team.record.d}D ${team.record.l}L`} />
              <Stat label="得失球" value={`${team.record.gf - team.record.ga >= 0 ? '+' : ''}${team.record.gf - team.record.ga}`} accent />
              <Stat label="成員" value={<span className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> {team.memberIds.length}</span>} />
            </div>
          </div>
        </div>
      </div>

      {/* Team Events Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wide flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" /> 球隊活動
          </h2>
          {canManage && (
            <Button size="sm" className="font-bold tracking-wide uppercase" onClick={() => navigate(`/teams/${team.id}/host`)}>
              <Plus className="w-4 h-4 mr-1" /> 發起活動
            </Button>
          )}
        </div>

        {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
          <Card className="p-10 text-center border-dashed">
            <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">仲未有活動{canManage ? '，發起第一場啦。' : '。'}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map(e => <EventRow key={e.id} event={e} venues={venues} />)}
            {pastEvents.length > 0 && (
              <>
                <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground pt-4">過往活動</h3>
                {pastEvents.map(e => <EventRow key={e.id} event={e} venues={venues} past />)}
              </>
            )}
          </div>
        )}
      </section>

      {/* Roster & Top Scorers */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wide">Roster</h2>
          <Card className="bg-card/50 backdrop-blur border-border overflow-hidden">
            <div className="divide-y divide-border">
              {team.memberIds.map(id => {
                const u = users.find(x => x.id === id);
                const memberRole = u?.role[team.id] || 'Member';
                return (
                  <div key={id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 ring-2 ring-background">
                        <AvatarImage src={u?.avatarUrl || `https://i.pravatar.cc/150?u=${id}`} />
                        <AvatarFallback>{u?.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold text-lg">{u?.name || id}</div>
                        <div className={`text-xs uppercase tracking-wider font-bold flex items-center gap-1 ${memberRole === 'Owner' ? 'text-primary' : memberRole === 'Admin' ? 'text-blue-400' : 'text-muted-foreground'}`}>
                          {memberRole === 'Owner' && <Crown className="w-3 h-3" />}
                          {memberRole === 'Admin' && <ShieldCheck className="w-3 h-3" />}
                          {memberRole}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-display font-bold">{u ? getTeamStats(u, team.id).goals : 0} <span className="text-sm text-muted-foreground">G</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wide flex items-center gap-2">
            <Trophy className="text-primary w-6 h-6" /> Top Scorers
          </h2>
          <Card className="p-6 bg-card/50 backdrop-blur border-border">
            <div className="space-y-4">
              {team.memberIds
                .map(id => users.find(u => u.id === id))
                .filter(Boolean)
                .sort((a: any, b: any) => getTeamStats(b, team.id).goals - getTeamStats(a, team.id).goals)
                .slice(0, 3)
                .map((u: any, i) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`text-xl font-display font-bold w-6 ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`}>{i + 1}</div>
                      <Avatar className="w-8 h-8"><AvatarImage src={u.avatarUrl} /></Avatar>
                      <span className="font-bold">{u.name}</span>
                    </div>
                    <div className="font-display text-xl">{getTeamStats(u, team.id).goals}</div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground font-bold tracking-wider uppercase">{label}</div>
      <div className={`text-2xl font-display font-bold ${accent ? 'text-green-500' : ''}`}>{value}</div>
    </div>
  );
}

function EventRow({ event, venues, past }: { event: any; venues: any[]; past?: boolean }) {
  const venue = venues.find(v => v.id === event.venueId);
  const venueLabel = venue?.name ?? event.venueAddress ?? '—';
  const hasCap = event.capacity != null;
  const isFull = hasCap && event.attendingIds.length >= event.capacity;
  const isCancelled = event.status === 'cancelled';
  
  const matchDate = safeDate(event.datetime);
  const matchEndDate = event.endDatetime ? safeDate(event.endDatetime) : undefined;
  
  return (
    <Link href={`/events/${event.id}`}>
      <Card className={`p-4 border-border hover:border-primary/50 transition-colors cursor-pointer flex items-center gap-4 ${past ? 'bg-card/30' : 'bg-card/50'}`}>
        <div className="w-16 text-center shrink-0">
          <div className="text-xs text-primary font-bold tracking-wider uppercase">{matchDate.toLocaleDateString('zh-HK', { month: 'short', day: 'numeric', timeZone: 'Asia/Hong_Kong' })}</div>
          <div className="text-lg font-display font-bold">{formatTime(matchDate)}</div>
          {matchEndDate && (
            <div className="text-[10px] text-muted-foreground">至 {formatTime(matchEndDate)}</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isCancelled && <Badge variant="destructive" className="text-[10px] uppercase tracking-wider font-bold h-5 px-1.5">已取消</Badge>}
            {event.fee === 0 && <Badge className="bg-green-500/15 text-green-400 border border-green-500/40 text-[10px] tracking-widest uppercase h-5 px-1.5">免費</Badge>}
            {!hasCap && <Badge className="bg-primary/15 text-primary border border-primary/40 text-[10px] tracking-widest uppercase h-5 px-1.5">無上限</Badge>}
          </div>
          <div className="font-bold truncate">{event.title}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 min-w-0"><MapPin className="w-3 h-3 shrink-0" /><span className="truncate max-w-[200px]">{venueLabel}</span></span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.attendingIds.length}{hasCap ? `/${event.capacity}` : ''}{!hasCap && <span className="text-primary ml-0.5">無上限</span>}</span>
            <span className={event.fee > 0 ? '' : 'text-green-400 font-bold'}>{event.fee > 0 ? `$${event.fee}/人` : '免費'}</span>
            {!past && isFull && <Badge variant="outline" className="border-yellow-500 text-yellow-500 text-[10px]">已滿額</Badge>}
          </div>
        </div>
        {past && event.finalScore && (
          <Badge variant="outline" className="font-display">{event.finalScore.home}:{event.finalScore.away}</Badge>
        )}
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </Card>
    </Link>
  );
}
