import React, { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Users, Filter, Star, Plus } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { hkDistricts, detectDistrict } from '@/lib/districts';
import { useLocation } from 'wouter';
import { safeDate, formatTime } from '@/lib/utils';

export default function Discover() {
  const [, setLocation] = useLocation();
  const { publicMatches, users, venues, currentUser, hostProfiles } = useAppStore();
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const activeMatches = publicMatches.filter(m => m.status === 'open' || m.status === 'full');

  const filteredMatches = activeMatches.filter(m => {
    const venue = m.venueId ? venues.find(v => v.id === m.venueId) : undefined;
    const rawDistrict = venue?.district ?? (m.venueAddress ? detectDistrict(m.venueAddress) : '其他');
    
    // Check if the match matches the selected district
    if (districtFilter !== 'all' && rawDistrict !== districtFilter) return false;
    if (levelFilter !== 'all' && m.skillLevel.toString() !== levelFilter) return false;
    
    // Filter out matches that are in the past
    const matchDateStr = safeDate(m.datetime).toLocaleDateString('en-CA', { timeZone: 'Asia/Hong_Kong' });
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Hong_Kong' });
    if (matchDateStr < todayStr) return false;

    return true;
  }).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  // Use hkDistricts from lib

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">
              公開場 <span className="text-primary">Discover</span>
            </h1>
            <p className="text-muted-foreground text-lg mt-2">任何人 book 咗場都可以 publish，散兵游勇即時報名加入。</p>
          </div>
          <Link href="/discover/host">
            <Button className="font-bold tracking-wide uppercase">
              <Plus className="w-5 h-5 mr-2" />
              成為 Host (發佈公開場)
            </Button>
          </Link>
        </div>

        <Card className="p-4 border-border bg-card/50 backdrop-blur flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger>
                <SelectValue placeholder="地區" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有地區</SelectItem>
                {hkDistricts.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
                <SelectItem value="其他">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="水平" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有水平</SelectItem>
                <SelectItem value="1">1★ (新手)</SelectItem>
                <SelectItem value="2">2★ (業餘)</SelectItem>
                <SelectItem value="3">3★ (常規)</SelectItem>
                <SelectItem value="4">4★ (競技)</SelectItem>
                <SelectItem value="5">5★ (職業)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </header>

      {filteredMatches.length === 0 ? (
        <Card className="p-12 text-center border-border bg-card/50 backdrop-blur border-dashed flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold uppercase tracking-wide mb-2">未有符合條件的公開場</h3>
            <p className="text-muted-foreground">你嗰區仲未有公開場，要唔要做第一個 host?</p>
          </div>
          <Link href="/discover/host">
            <Button size="lg" className="font-bold tracking-wide uppercase">立即發佈</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredMatches.map((match, i) => {
            const venue = match.venueId ? venues.find(v => v.id === match.venueId) : undefined;
            const venueLabel = venue?.name ?? match.venueAddress ?? '—';
            const districtLabel = venue?.district ?? (match.venueAddress ? detectDistrict(match.venueAddress) : '其他');
            const host = users.find(u => u.id === match.hostId);
            const hostProfile = hostProfiles.find(p => p.userId === match.hostId);
            const isAttending = currentUser ? match.attendees.includes(currentUser.id) : false;
            const cap = match.maxPlayers;
            const isFull = cap != null && match.attendees.length >= cap;
            const fillPercentage = cap != null && cap > 0 ? (match.attendees.length / cap) * 100 : 0;
            
            // Safe date parser to handle invalid dates
            const matchDate = safeDate(match.datetime);

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card 
                  onClick={() => setLocation(`/discover/${match.id}`)}
                  className={`overflow-hidden border-border hover:border-primary/50 transition-all cursor-pointer bg-card/50 backdrop-blur relative ${isAttending ? 'ring-2 ring-primary' : ''}`}
                >
                  {isAttending && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-primary text-primary-foreground font-bold uppercase">已報名</Badge>
                    </div>
                  )}
                  <div className="p-6 pb-0 flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-primary/20 flex flex-col items-center justify-center border border-primary/30 shrink-0">
                      <span className="text-sm font-bold text-primary leading-none uppercase">
                        {matchDate.toLocaleDateString('zh-HK', { month: 'short', timeZone: 'Asia/Hong_Kong' })}
                      </span>
                      <span className="text-2xl font-display font-bold text-primary leading-tight">
                        {matchDate.toLocaleDateString('zh-HK', { day: 'numeric', timeZone: 'Asia/Hong_Kong' })}
                      </span>
                    </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] tracking-wider uppercase border-primary/30 text-primary bg-primary/5">
                            PUBLIC
                          </Badge>
                          {match.isVerified && (
                            <Badge variant="outline" className="text-[10px] tracking-wider uppercase border-blue-500/30 text-blue-500 bg-blue-500/5">
                              VERIFIED
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venueLabel} 香港 ${districtLabel}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} // 避免觸發 Link 跳轉到 match detail
                            className="hover:underline flex items-center gap-1"
                            title="在 Google Maps 中開啟"
                          >
                            {venueLabel}
                          </a>
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {districtLabel}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <img src={host?.avatarUrl} alt={host?.name} className="w-6 h-6 rounded-full" />
                          <span className="font-medium">{host?.name}</span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {hostProfile?.averageRating.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                        <div className="font-bold text-primary">
                          ${match.fee} <span className="text-xs text-muted-foreground font-normal">/ 人</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span>已報名 {match.attendees.length}{cap != null ? ` / ${cap}` : ' (不設上限)'}</span>
                          <span className={`${isFull ? 'text-destructive' : 'text-primary'}`}>
                            {cap == null ? '無限位' : isFull ? '已滿額' : `尚餘 ${cap - match.attendees.length} 位`}
                          </span>
                        </div>
                        {cap != null && (
                          <Progress value={fillPercentage} className={`h-2 ${isFull ? 'bg-destructive/20' : 'bg-primary/20'}`} indicatorClassName={isFull ? 'bg-destructive' : 'bg-primary'} />
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> 
                          {matchDate.toLocaleDateString('zh-HK', { month: 'short', day: 'numeric', weekday: 'short', timeZone: 'Asia/Hong_Kong' })} 
                          <span className="ml-1">
                            {formatTime(match.datetime)}
                            {match.endDatetime && (
                              <span> – {formatTime(match.endDatetime)}</span>
                            )}
                          </span>
                        </span>
                        <span>•</span>
                        <span>{match.surface === 'hard' ? '硬地' : match.surface === 'turf' ? '仿真草' : '草地'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">水平: {match.skillLevel}★</span>
                      </div>
                    </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}