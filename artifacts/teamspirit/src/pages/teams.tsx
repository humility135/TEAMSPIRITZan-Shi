import React, { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Plus, UserPlus, Users, ArrowRight, Search, Shield } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const HK_DISTRICTS = ['中西區', '灣仔', '東區', '南區', '油尖旺', '深水埗', '九龍城', '黃大仙', '觀塘', '荃灣', '屯門', '元朗', '北區', '大埔', '沙田', '西貢', '葵青', '離島'];

export default function Teams() {
  const { teams, currentUser } = useAppStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const filtered = teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">
              My <span className="text-primary">Teams</span>
            </h1>
            <p className="text-muted-foreground text-lg mt-2">管理你嘅球隊、查看戰績、發起活動。</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="font-bold tracking-wide uppercase flex-1 md:flex-none">
                  <UserPlus className="w-4 h-4 mr-2" />
                  加入球隊
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display uppercase tracking-wider text-2xl">加入球隊</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-code">輸入 6 位邀請碼</Label>
                    <Input id="invite-code" placeholder="例如 ABC123" maxLength={6} className="text-center text-2xl tracking-widest font-display uppercase" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">向球隊 Admin 索取邀請碼，加入後 Admin 會審批你嘅申請。</p>
                </div>
                <DialogFooter>
                  <Button onClick={() => { setJoinOpen(false); toast({ title: '申請已送出', description: '等待球隊 Admin 審批。' }); }} className="w-full font-bold tracking-wide uppercase">
                    送出申請
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold tracking-wide uppercase flex-1 md:flex-none">
                  <Plus className="w-4 h-4 mr-2" />
                  創立球隊
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display uppercase tracking-wider text-2xl">創立新球隊</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="team-name">球隊名稱</Label>
                    <Input id="team-name" placeholder="例如 東九龍勁旅" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-district">主場地區</Label>
                    <Select>
                      <SelectTrigger id="team-district">
                        <SelectValue placeholder="揀地區" />
                      </SelectTrigger>
                      <SelectContent>
                        {HK_DISTRICTS.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-level">水平 (1-5★)</Label>
                    <Select>
                      <SelectTrigger id="team-level">
                        <SelectValue placeholder="揀水平" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5].map(n => (<SelectItem key={n} value={String(n)}>{'★'.repeat(n)} ({n}/5)</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">創立後你會自動成為 Owner，可以邀請隊友、發起活動。Logo 可以稍後再加。</p>
                </div>
                <DialogFooter>
                  <Button onClick={() => { setCreateOpen(false); toast({ title: '球隊已創立', description: '去邀請你嘅隊友啦！' }); }} className="w-full font-bold tracking-wide uppercase">
                    立即創立
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋你嘅球隊…" className="pl-11 h-12" />
        </div>
      </header>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-display font-bold uppercase tracking-wide mb-2">仲未加入任何球隊</h3>
          <p className="text-muted-foreground mb-6">創立你自己嘅球隊，或者用邀請碼加入朋友嘅隊伍。</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setJoinOpen(true)}><UserPlus className="w-4 h-4 mr-2" />加入球隊</Button>
            <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />創立球隊</Button>
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((team, i) => {
            const isOwner = team.ownerId === currentUser.id;
            const isAdmin = team.adminIds?.includes(currentUser.id);
            const role = isOwner ? 'OWNER' : isAdmin ? 'ADMIN' : 'MEMBER';
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/teams/${team.id}`}>
                  <Card className="p-5 border-border bg-card/50 backdrop-blur hover:border-primary/50 transition-colors cursor-pointer group h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-xl bg-black overflow-hidden relative shrink-0">
                        <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-[10px] tracking-widest uppercase ${isOwner ? 'border-primary text-primary' : ''}`}>
                            {role}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-lg leading-tight truncate">{team.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Users className="w-4 h-4" /> {team.memberIds.length} 名成員
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
