import React, { useState, useRef } from 'react';
import { Link, useRoute } from 'wouter';
import { Users, Trophy, Settings, Calendar, MapPin, Camera, Plus, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const ACCENT_COLORS = ['#84cc16', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#10b981'];

export default function TeamDetail() {
  const [, params] = useRoute('/teams/:teamId');
  const { teams, users, events, venues, currentUser, updateTeam } = useAppStore();
  const { toast } = useToast();

  const team = teams.find(t => t.id === params?.teamId);
  const [manageOpen, setManageOpen] = useState(false);
  const [name, setName] = useState(team?.name || '');
  const [accentColor, setAccentColor] = useState(team?.accentColor || ACCENT_COLORS[0]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!team) return <div className="p-8 text-center">Team not found</div>;

  const teamEvents = events.filter(e => e.teamId === team.id);
  const upcomingEvents = teamEvents.filter(e => e.status === 'scheduled');
  const pastEvents = teamEvents.filter(e => e.status === 'finished');
  const isOwnerOrAdmin = currentUser.id === 'u1' || team.memberIds[0] === currentUser.id;

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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="relative rounded-3xl overflow-hidden bg-card border border-border p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full filter blur-[100px] opacity-20" style={{ backgroundColor: team.accentColor }} />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-black ring-4 ring-background shadow-2xl shrink-0">
            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                {team.isPro && (
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4 text-black" style={{ backgroundColor: team.accentColor }}>
                    Pro Club
                  </div>
                )}
                <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tight">{team.name}</h1>
              </div>
              <Dialog open={manageOpen} onOpenChange={setManageOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10">
                    <Settings className="w-4 h-4" /> 管理球隊
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display uppercase tracking-wider text-2xl">管理球隊</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-5 py-4">
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
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => { setManageOpen(false); setLogoPreview(null); setName(team.name); }}>取消</Button>
                    <Button onClick={handleSave} className="font-bold tracking-wide uppercase">儲存</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-8 pt-4">
              <Stat label="戰績" value={`${team.record.w}W ${team.record.d}D ${team.record.l}L`} />
              <Stat label="得失球" value={`+${team.record.gf - team.record.ga}`} accent />
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
          {isOwnerOrAdmin && (
            <Button size="sm" className="font-bold tracking-wide uppercase">
              <Plus className="w-4 h-4 mr-1" /> 發起活動
            </Button>
          )}
        </div>

        {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
          <Card className="p-10 text-center border-dashed">
            <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">仲未有活動，發起第一場啦。</p>
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
                const u = users.find(x => x.id === id) || { id, name: id, avatarUrl: '', seasonStats: { goals: 0 } };
                const isOwner = team.memberIds[0] === id;
                return (
                  <div key={id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 ring-2 ring-background">
                        <AvatarImage src={u.avatarUrl || `https://i.pravatar.cc/150?u=${id}`} />
                        <AvatarFallback>{u.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold text-lg">{u.name}</div>
                        <div className="text-xs text-primary uppercase tracking-wider font-bold">{isOwner ? 'Owner' : 'Member'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-display font-bold">{(u as any).seasonStats?.goals || 0} <span className="text-sm text-muted-foreground">G</span></div>
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
                .sort((a: any, b: any) => (b.seasonStats?.goals || 0) - (a.seasonStats?.goals || 0))
                .slice(0, 3)
                .map((u: any, i) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`text-xl font-display font-bold w-6 ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`}>{i + 1}</div>
                      <Avatar className="w-8 h-8"><AvatarImage src={u.avatarUrl} /></Avatar>
                      <span className="font-bold">{u.name}</span>
                    </div>
                    <div className="font-display text-xl">{u.seasonStats?.goals || 0}</div>
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
  return (
    <Link href={`/events/${event.id}`}>
      <Card className={`p-4 border-border hover:border-primary/50 transition-colors cursor-pointer flex items-center gap-4 ${past ? 'bg-card/30' : 'bg-card/50'}`}>
        <div className="w-16 text-center shrink-0">
          <div className="text-xs text-primary font-bold tracking-wider uppercase">{new Date(event.datetime).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric' })}</div>
          <div className="text-lg font-display font-bold">{new Date(event.datetime).toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{event.title}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{venue?.name}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.attendingIds.length}</span>
            {event.fee > 0 && <span>${event.fee}/人</span>}
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
