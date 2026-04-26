import React from 'react';
import { useRoute, Link } from 'wouter';
import { Users, ChevronLeft, ArrowRightLeft, ShieldCheck, Mail, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { safeDate, formatTime } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function ManageMatch() {
  const [, params] = useRoute('/manage-match/:matchId');
  const { publicMatches, users, currentUser, isProMode } = useAppStore();
  
  const matchId = params?.matchId;
  const match = publicMatches.find(m => m.id === matchId);

  if (!match) {
    return <div className="p-8 text-center text-muted-foreground">找不到此公開場</div>;
  }

  if (match.hostId !== currentUser.id) {
    return <div className="p-8 text-center text-destructive font-bold">你無權限管理此活動</div>;
  }

  const isCancelled = match.status === 'cancelled';
  const cap = match.maxPlayers;
  const attendees = match.attendees.map(id => users.find(u => u.id === id)).filter(Boolean);
  const waitlist = match.waitlistIds.map(id => users.find(u => u.id === id)).filter(Boolean);

  const handleKick = (userId: string, name: string) => {
    if (window.confirm(`確定要將 ${name} 移出名單嗎？（此功能會退款給該名球員並通知候補）`)) {
      toast.info(`已將 ${name} 移出名單，系統會自動處理退款。`);
      // TODO: Connect to backend API for kicking a user
    }
  };

  const handlePromote = (userId: string, name: string) => {
    toast.success(`已發送補位通知給 ${name}！`);
    // TODO: Connect to backend API to manually promote waitlist
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/discover/${matchId}`}>
            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-black/20">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold uppercase tracking-tight">管理名單</h1>
            <div className="flex items-center gap-2 mt-1">
              {isCancelled && <Badge variant="destructive" className="uppercase tracking-widest font-bold">已取消</Badge>}
              <p className="text-muted-foreground text-sm flex items-center gap-1">
                {match.venueAddress} • 
                {safeDate(match.datetime).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric', weekday: 'short', timeZone: 'Asia/Hong_Kong' })} {formatTime(match.datetime)}
                {match.endDatetime && (
                  <span> – {formatTime(match.endDatetime)}</span>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("已發送群發訊息給所有出席者")}>
            <Mail className="w-4 h-4 mr-2" /> 群發訊息
          </Button>
          {isProMode && (
            <Button size="sm" className="bg-primary text-primary-foreground font-bold" onClick={() => toast.success("已下載名單 Excel")}>
              匯出名單
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Attendees List */}
        <Card className="p-6 border-primary/20 bg-primary/5 backdrop-blur">
          <div className="flex justify-between items-center mb-6 border-b border-primary/20 pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
              <ShieldCheck className="w-5 h-5" /> 正選名單
            </h2>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {attendees.length} {cap ? `/ ${cap}` : ''}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {attendees.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">暫時未有人報名</p>
            ) : (
              attendees.map(user => (
                <div key={user!.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-border/50 hover:bg-black/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border border-border">
                      <AvatarImage src={user!.avatarUrl} />
                      <AvatarFallback>{user!.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-sm">{user!.name}</div>
                      <div className="text-xs text-muted-foreground">{isCancelled ? '已退款' : '已付款'}</div>
                    </div>
                  </div>
                  {!isCancelled && (
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleKick(user!.id, user!.name)} title="移出名單">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Waitlist List */}
        <Card className="p-6 border-border bg-card/50 backdrop-blur">
          <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" /> 候補名單
            </h2>
            <Badge variant="outline" className="text-muted-foreground">
              {waitlist.length} 人
            </Badge>
          </div>

          <div className="space-y-3">
            {waitlist.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">暫時無候補</p>
            ) : (
              waitlist.map((user, index) => (
                <div key={user!.id} className="flex items-center justify-between p-3 bg-black/10 rounded-xl border border-border/30 hover:bg-black/20 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-center text-xs font-bold text-muted-foreground">#{index + 1}</div>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user!.avatarUrl} />
                      <AvatarFallback>{user!.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="font-bold text-sm">{user!.name}</div>
                  </div>
                  {!isCancelled && (
                    <Button variant="outline" size="sm" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handlePromote(user!.id, user!.name)}>
                      <ArrowRightLeft className="w-3 h-3 mr-1" /> 補上
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}