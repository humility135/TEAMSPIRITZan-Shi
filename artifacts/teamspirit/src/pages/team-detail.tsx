import React from 'react';
import { useRoute } from 'wouter';
import { Users, Trophy, ChevronRight, Settings } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function TeamDetail() {
  const [, params] = useRoute('/teams/:teamId');
  const { teams, users } = useAppStore(); // In real app, we'd fetch members
  
  const team = teams.find(t => t.id === params?.teamId);
  
  if (!team) return <div>Team not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Team Header */}
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
              <Button variant="outline" className="gap-2 bg-white/5 border-white/10 hover:bg-white/10">
                <Settings className="w-4 h-4" /> 管理球隊
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-8 pt-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground font-bold tracking-wider uppercase">戰績</div>
                <div className="text-2xl font-display font-bold">{team.record.w}W {team.record.d}D {team.record.l}L</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground font-bold tracking-wider uppercase">得失球</div>
                <div className="text-2xl font-display font-bold text-green-500">+{team.record.gf - team.record.ga}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground font-bold tracking-wider uppercase">成員</div>
                <div className="text-2xl font-display font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> {team.memberIds.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roster & Stats */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wide">Roster</h2>
          <Card className="bg-card/50 backdrop-blur border-border overflow-hidden">
            <div className="divide-y divide-border">
              {team.memberIds.map(id => {
                // Mock resolving user details
                const u = { id, name: id === 'u1' ? 'Ah Fai' : id === 'u2' ? 'Kit C.' : 'Ming', role: id==='u1'?'Owner':'Member', goals: id==='u1'?12:2 };
                return (
                  <div key={id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 ring-2 ring-background">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${id}`} />
                        <AvatarFallback>{u.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold text-lg">{u.name}</div>
                        <div className="text-xs text-primary uppercase tracking-wider font-bold">{u.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-display font-bold">{u.goals} <span className="text-sm text-muted-foreground">G</span></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wide flex items-center gap-2">
            <Trophy className="text-primary w-6 h-6" /> Top Scorers
          </h2>
          <Card className="p-6 bg-card/50 backdrop-blur border-border">
             <div className="space-y-4">
               {/* Mock leaderboard */}
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="text-xl font-display font-bold text-primary w-6">1</div>
                   <Avatar className="w-8 h-8"><AvatarImage src="https://i.pravatar.cc/150?u=u1" /></Avatar>
                   <span className="font-bold">Ah Fai</span>
                 </div>
                 <div className="font-display text-xl">12</div>
               </div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="text-xl font-display font-bold text-muted-foreground w-6">2</div>
                   <Avatar className="w-8 h-8"><AvatarImage src="https://i.pravatar.cc/150?u=u3" /></Avatar>
                   <span className="font-bold">Ming</span>
                 </div>
                 <div className="font-display text-xl">5</div>
               </div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="text-xl font-display font-bold text-muted-foreground w-6">3</div>
                   <Avatar className="w-8 h-8"><AvatarImage src="https://i.pravatar.cc/150?u=u2" /></Avatar>
                   <span className="font-bold">Kit C.</span>
                 </div>
                 <div className="font-display text-xl">2</div>
               </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
