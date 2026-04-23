import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useAppStore, getTeamStats, getAggregatedStats } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Star, ShieldCheck, Camera, Pencil, Radar as RadarIcon, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const [, setLocation] = useLocation();
  const { currentUser, teams, isProMode, hostProfiles, updateCurrentUser, logout } = useAppStore();
  const { toast } = useToast();
  const myTeams = teams.filter(t => t.memberIds.includes(currentUser.id));
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const stats = selectedTeamId === 'all'
    ? getAggregatedStats(currentUser)
    : getTeamStats(currentUser, selectedTeamId);
  const selectedTeam = myTeams.find(t => t.id === selectedTeamId);
  const hostProfile = hostProfiles.find(p => p.userId === currentUser.id);

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(localStorage.getItem('teamspirit_bio') || 'A reliable midfielder with a knack for showing up when it counts. Active since 2022.');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: '圖片太大', description: '頭像上限 2MB', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateCurrentUser({
      name: name.trim() || currentUser.name,
      ...(avatarPreview ? { avatarUrl: avatarPreview } : {})
    });
    localStorage.setItem('teamspirit_bio', bio);
    setEditOpen(false);
    setAvatarPreview(null);
    toast({ title: '個人資料已更新' });
  };

  // Radar chart data mock based on stats
  const radarData = [
    { subject: '入球', A: Math.min(100, stats.goals * 5), fullMark: 100 },
    { subject: '助攻', A: Math.min(100, stats.assists * 6), fullMark: 100 },
    { subject: '出席率', A: stats.attendance, fullMark: 100 },
    { subject: '紀律', A: Math.max(0, 100 - (stats.yellow * 10 + stats.red * 20)), fullMark: 100 },
    { subject: '經驗', A: Math.min(100, stats.matches * 3), fullMark: 100 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="relative group">
          <Avatar className="w-32 h-32 md:w-48 md:h-48 ring-4 ring-primary/20">
            <AvatarImage src={currentUser.avatarUrl} />
            <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
          </Avatar>
          <button
            onClick={() => setEditOpen(true)}
            className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            title="編輯個人資料"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tight">{currentUser.name}</h1>
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} className="text-muted-foreground hover:text-primary">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  try {
                    await logout();
                    setLocation('/');
                  } catch (e) {
                    toast({ title: '登出失敗', variant: 'destructive' });
                  }
                }} 
                className="text-destructive border-destructive hover:bg-destructive/10 ml-auto md:ml-4"
              >
                <LogOut className="w-4 h-4 mr-2" />
                登出
              </Button>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
              <Badge variant="outline" className={`font-bold tracking-widest uppercase ${currentUser.subscription === 'pro' ? 'border-primary text-primary' : ''}`}>
                {currentUser.subscription.toUpperCase()} PLAN
              </Badge>
              <span className="text-sm text-muted-foreground font-bold tracking-wider uppercase">
                {currentUser.subscription === 'pro' ? 'Pro 會員' : 'Free Forever'}
              </span>
            </div>
          </div>
          <p className="text-muted-foreground max-w-lg whitespace-pre-line">{bio}</p>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider text-2xl">編輯個人資料</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="flex flex-col items-center gap-3">
              <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                <Avatar className="w-28 h-28 ring-2 ring-border">
                  <AvatarImage src={avatarPreview || currentUser.avatarUrl} />
                  <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-7 h-7 text-white" />
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()} className="text-xs text-primary">
                <Camera className="w-3 h-3 mr-1" /> 更換頭像
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-name">名稱</Label>
              <Input id="p-name" value={name} onChange={e => setName(e.target.value)} maxLength={30} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-bio">自我介紹</Label>
              <Textarea id="p-bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={150} placeholder="講下你嘅踢波風格 / 位置…" />
              <div className="text-xs text-muted-foreground text-right">{bio.length}/150</div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setEditOpen(false); setAvatarPreview(null); setName(currentUser.name); }}>取消</Button>
            <Button onClick={handleSave} className="font-bold tracking-wide uppercase">儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto md:mx-0 bg-black/40 p-1 rounded-xl">
          <TabsTrigger value="stats" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold uppercase tracking-wider">球員數據</TabsTrigger>
          <TabsTrigger value="host" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold uppercase tracking-wider">Host 紀錄</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-8 space-y-6">
          {myTeams.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-1">球隊</span>
              <button
                onClick={() => setSelectedTeamId('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${
                  selectedTeamId === 'all' ? 'bg-primary text-primary-foreground' : 'bg-black/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                所有球隊
              </button>
              {myTeams.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeamId(t.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wider transition-colors flex items-center gap-2 ${
                    selectedTeamId === t.id ? 'bg-primary text-primary-foreground' : 'bg-black/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: t.accentColor }} />
                  {t.name}
                </button>
              ))}
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 border-border bg-card/50 backdrop-blur">
              <div className="flex items-baseline justify-between mb-8 gap-3 flex-wrap">
                <h2 className="text-2xl font-display font-bold uppercase tracking-wide">Career Stats</h2>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {selectedTeamId === 'all' ? `所有球隊（${myTeams.length}）` : selectedTeam?.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <div className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Matches</div>
                  <div className="text-5xl font-display font-bold">{stats.matches}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Attendance</div>
                  <div className="text-5xl font-display font-bold">{stats.attendance}%</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Goals</div>
                  <div className="text-5xl font-display font-bold text-primary">{stats.goals}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Assists</div>
                  <div className="text-5xl font-display font-bold text-white">{stats.assists}</div>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-border bg-card/50 backdrop-blur flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
              <h2 className="absolute top-8 left-8 text-2xl font-display font-bold uppercase tracking-wide z-10">Player Radar</h2>
              
              {!isProMode ? (
                <div className="text-center z-10">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 blur-sm">
                    <RadarIcon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Pro Feature</h3>
                  <p className="text-sm text-muted-foreground mb-4">解鎖完整的球員能力雷達圖分析。</p>
                </div>
              ) : (
                <div className="w-full h-[250px] mt-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 'bold' }} />
                      <Radar name={currentUser.name} dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="host" className="mt-8">
          <Card className="p-8 border-border bg-card/50 backdrop-blur">
            {!hostProfile ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold uppercase tracking-wide mb-2">你還未成為 Host</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    分享你的場地，賺取評分。建立良好的 Host 聲譽，吸引更多高質素波友報名你的公開場。
                  </p>
                </div>
                <Link href="/discover/host">
                  <Button size="lg" className="font-bold tracking-widest uppercase">成為 Host 發佈第一場</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                <h2 className="text-2xl font-display font-bold uppercase tracking-wide">搞手紀錄</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/30 p-6 rounded-2xl text-center">
                    <div className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-2">主辦次數</div>
                    <div className="text-4xl font-display font-bold text-white">{hostProfile.hostedCount}</div>
                  </div>
                  <div className="bg-black/30 p-6 rounded-2xl text-center">
                    <div className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-2">準時率</div>
                    <div className="text-4xl font-display font-bold text-primary">{hostProfile.punctualityRate}%</div>
                  </div>
                  <div className="bg-black/30 p-6 rounded-2xl text-center">
                    <div className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-2">平均評分</div>
                    <div className="text-4xl font-display font-bold text-yellow-500 flex items-center justify-center gap-1">
                      {hostProfile.averageRating.toFixed(1)} <Star className="w-5 h-5 fill-yellow-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="font-bold uppercase tracking-wide">波友評語 ({hostProfile.reviews.length})</h3>
                  <div className="grid gap-4">
                    {hostProfile.reviews.map((review, i) => (
                      <div key={i} className="bg-black/20 p-4 rounded-xl border border-border/50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-1 text-yellow-500">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star key={j} className={`w-3 h-3 ${j < review.rating ? 'fill-yellow-500' : 'fill-transparent text-muted-foreground'}`} />
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString()}</div>
                        </div>
                        <p className="text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
