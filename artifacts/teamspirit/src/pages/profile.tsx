import React from 'react';
import { useAppStore } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function Profile() {
  const { currentUser, isProMode } = useAppStore();
  const stats = currentUser.seasonStats;

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
        <Avatar className="w-32 h-32 md:w-48 md:h-48 ring-4 ring-primary/20">
          <AvatarImage src={currentUser.avatarUrl} />
          <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tight">{currentUser.name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
              <Badge variant="outline" className={`font-bold tracking-widest uppercase ${currentUser.subscription === 'pro' ? 'border-primary text-primary' : ''}`}>
                {currentUser.subscription.toUpperCase()} PLAN
              </Badge>
              <span className="text-sm text-muted-foreground font-bold tracking-wider uppercase">
                {currentUser.tokensBalance} Tokens
              </span>
            </div>
          </div>
          <p className="text-muted-foreground max-w-lg">
            A reliable midfielder with a knack for showing up when it counts. 
            Active since 2022.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-8 border-border bg-card/50 backdrop-blur">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wide mb-8">Career Stats</h2>
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
                <Radar className="w-8 h-8 text-primary" />
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
    </div>
  );
}
