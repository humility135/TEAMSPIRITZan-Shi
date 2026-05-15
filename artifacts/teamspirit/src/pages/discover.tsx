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
import { hkDistricts, detectDistrict, districtTranslations } from '@/lib/districts';
import { useLocation } from 'wouter';
import { safeDate, formatTime } from '@/lib/utils';
import { getDistance, getUserLocation } from '@/lib/geo';
import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

export default function Discover() {
  const [, setLocation] = useLocation();
  const { publicMatches, users, venues, currentUser, hostProfiles } = useAppStore();
  const { t, lang } = useI18n();
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const searchParams = new URLSearchParams(window.location.search);
  const q = searchParams.get('q') || '';
  const now = Date.now();

  useEffect(() => {
    getUserLocation()
      .then(pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }))
      .catch(() => {});
  }, []);

  const activeMatches = publicMatches.filter(m => m.status === 'open' || m.status === 'full');

  const filteredMatches = activeMatches
    .map(m => {
      const venue = m.venueId ? venues.find(v => v.id === m.venueId) : undefined;
      const matchDate = safeDate(m.datetime);
      const endTimeMs = m.endDatetime ? safeDate(m.endDatetime).getTime() : matchDate.getTime();

      let distanceKm: number | null = null;
      if (
        userLocation &&
        venue &&
        Number.isFinite(venue.lat) &&
        Number.isFinite(venue.lng)
      ) {
        const d = getDistance(userLocation.lat, userLocation.lng, venue.lat, venue.lng);
        if (Number.isFinite(d)) distanceKm = d;
      }

      return { match: m, venue, matchDate, endTimeMs, distanceKm };
    })
    .filter(({ match: m, venue, endTimeMs }) => {
      const rawDistrict = venue?.district ?? (m.venueAddress ? detectDistrict(m.venueAddress) : t('discoverOther'));

      if (districtFilter !== 'all' && rawDistrict !== districtFilter) return false;
      if (levelFilter !== 'all' && m.skillLevel.toString() !== levelFilter) return false;
      if (endTimeMs < now) return false;

      if (q) {
        const searchLower = q.toLowerCase();
        const matchVenue = venue?.name?.toLowerCase().includes(searchLower) || 
                           venue?.nameEn?.toLowerCase().includes(searchLower) ||
                           m.venueAddress?.toLowerCase().includes(searchLower) ||
                           m.venueAddressEn?.toLowerCase().includes(searchLower);
        if (!matchVenue) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const dA = a.distanceKm ?? Infinity;
      const dB = b.distanceKm ?? Infinity;
      if (dA !== dB) return dA - dB;
      return a.matchDate.getTime() - b.matchDate.getTime();
    });

  // Use hkDistricts from lib

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">
              {t('discover')}
            </h1>
            <p className="text-muted-foreground text-lg mt-2">{t('discoverDesc')}</p>
          </div>
          <Link href="/discover/host">
            <Button className="font-bold tracking-wide uppercase">
              <Plus className="w-5 h-5 mr-2" />
              {t('hostMatch')}
            </Button>
          </Link>
        </div>

        <Card className="p-4 border-border bg-card/50 backdrop-blur flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('filterDistrict')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allDistricts')}</SelectItem>
                {hkDistricts.map(d => (
                  <SelectItem key={d} value={d}>{lang === 'en' ? districtTranslations[d] : d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('filterLevel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allLevels')}</SelectItem>
                <SelectItem value="1">{t('level1')}</SelectItem>
                <SelectItem value="2">{t('level2')}</SelectItem>
                <SelectItem value="3">{t('level3')}</SelectItem>
                <SelectItem value="4">{t('level4')}</SelectItem>
                <SelectItem value="5">{t('level5')}</SelectItem>
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
            <h3 className="text-2xl font-display font-bold uppercase tracking-wide mb-2">{t('noMatchesFound')}</h3>
            <p className="text-muted-foreground">{t('beFirstHost')}</p>
          </div>
          <Link href="/discover/host">
            <Button size="lg" className="font-bold tracking-wide uppercase">{t('hostNow')}</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredMatches.map(({ match, venue, distanceKm, matchDate }, i) => {
            const venueLabel = lang === 'en' ? (venue?.nameEn ?? match.venueAddressEn ?? match.venueAddress ?? '—') : (venue?.name ?? match.venueAddress ?? '—');
            const districtLabel = lang === 'en' ? (venue?.districtEn ?? (match.venueAddress ? districtTranslations[detectDistrict(match.venueAddress)] : t('discoverOther'))) : (venue?.district ?? (match.venueAddress ? detectDistrict(match.venueAddress) : t('discoverOther')));
            const host = users.find(u => u.id === match.hostId);
            const hostProfile = hostProfiles.find(p => p.userId === match.hostId);
            const isAttending = currentUser ? match.attendees.includes(currentUser.id) : false;
            const cap = match.maxPlayers;
            const isFull = cap != null && match.attendees.length >= cap;
            const fillPercentage = cap != null && cap > 0 ? (match.attendees.length / cap) * 100 : 0;

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  role="link"
                  tabIndex={0}
                  onClick={() => setLocation(`/discover/${match.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setLocation(`/discover/${match.id}`);
                    }
                  }}
                  className={`overflow-hidden border-border hover:border-primary/50 transition-all cursor-pointer bg-card/50 backdrop-blur relative ${isAttending ? 'ring-2 ring-primary' : ''}`}
                >
                  {isAttending && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-primary text-primary-foreground font-bold uppercase">{t('joined')}</Badge>
                    </div>
                  )}
                  <div className="p-6 pb-0 flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-primary/20 flex flex-col items-center justify-center border border-primary/30 shrink-0">
                      <span className="text-sm font-bold text-primary leading-none uppercase">
                        {matchDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-HK', { month: 'short', timeZone: 'Asia/Hong_Kong' })}
                      </span>
                      <span className="text-2xl font-display font-bold text-primary leading-tight">
                        {matchDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-HK', { day: 'numeric', timeZone: 'Asia/Hong_Kong' })}
                      </span>
                    </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] tracking-wider uppercase border-primary/30 text-primary bg-primary/5">
                            {t('publicLabel')}
                          </Badge>
                          {match.isVerified && (
                            <Badge variant="outline" className="text-[10px] tracking-wider uppercase border-blue-500/30 text-blue-500 bg-blue-500/5">
                              {t('verified')}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                          <span className="flex items-center gap-2">
                            <span className="min-w-0 truncate">{venueLabel}</span>
                            <button
                              type="button"
                              className="text-xs text-primary hover:underline shrink-0"
                              aria-label={t('discoverMapAria')}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(
                                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venueLabel} ${lang === 'en' ? 'Hong Kong' : '香港'} ${districtLabel}`)}`,
                                  "_blank",
                                  "noopener,noreferrer",
                                );
                              }}
                            >
                              {t('openMap')}
                            </button>
                          </span>
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {districtLabel}
                          {distanceKm != null && (
                            <span className="ml-2 opacity-70">
                              · {distanceKm.toFixed(1)}km
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {host?.avatarUrl ? <img src={host.avatarUrl} alt={host?.name} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-white/10" />}
                          <span className="font-medium">{host?.name}</span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {hostProfile?.averageRating != null ? hostProfile.averageRating.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                        <div className="font-bold text-primary">
                          ${match.fee} <span className="text-xs text-muted-foreground font-normal">/ {t('perPerson')}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span>{t('registered')} {match.attendees.length}{cap != null ? ` / ${cap}` : ` (${t('unlimited')})`}</span>
                          <span className={`${isFull ? 'text-destructive' : 'text-primary'}`}>
                            {cap == null ? t('unlimited') : isFull ? t('full') : `${cap - match.attendees.length} ${t('spotsLeft')}`}
                          </span>
                        </div>
                        {cap != null && (
                          <Progress value={fillPercentage} className={`h-2 ${isFull ? 'bg-destructive/20' : 'bg-primary/20'}`} indicatorClassName={isFull ? 'bg-destructive' : 'bg-primary'} />
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> 
                          {matchDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-HK', { month: 'short', day: 'numeric', weekday: 'short', timeZone: 'Asia/Hong_Kong' })} 
                          <span className="ml-1">
                            {formatTime(match.datetime)}
                            {match.endDatetime && (
                              <span> – {formatTime(match.endDatetime)}</span>
                            )}
                          </span>
                        </span>
                        <span>•</span>
                        <span>{match.surface === 'hard' ? t('hostMatchSurfaceHard') : match.surface === 'turf' ? t('hostMatchSurfaceTurf') : t('hostMatchSurfaceGrass')}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">{t('skillLevel')}: {match.skillLevel}★</span>
                      </div>

                      <div className="pt-2">
                        <Link href={`/discover/${match.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="font-bold uppercase tracking-wider">
                            {t('viewDetail')}
                          </Button>
                        </Link>
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
