import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users, ArrowRight, Compass, Shield, Plus, X, Droplets, CloudRain, Thermometer, AlertTriangle, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { OnboardingTour } from '@/components/onboarding-tour';
import { useAppStore, getAggregatedStats } from '@/lib/store';
import { safeDate, formatTime } from '@/lib/utils';
import { getDistance, getUserLocation } from '@/lib/geo';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/lib/i18n';
import { detectDistrict, districtTranslations } from '@/lib/districts';

type NearbyWeatherResponse = {
  fetchedAt: string;
  lang: 'tc' | 'en';
  location: { lat: number; lng: number };
  temperature: { station: string; value: number; unit: string; recordTime: string; distanceKm?: number };
  humidity?: { value: number; unit: string; recordTime: string };
  rainfall?: { district: string; max: number; min?: number; unit: string; startTime: string; endTime: string };
  warnings: Array<{ code: string; name: string }>;
  icon?: number[];
  iconUpdateTime?: string;
  updateTime?: string;
};

function getWeatherErrorText(err: unknown, lang: 'en' | 'tc') {
  const anyErr = err as any;
  const status = typeof anyErr?.status === 'number' ? anyErr.status : undefined;
  if (status === 404) {
    return lang === 'en'
      ? 'Weather API not found. Please restart/update the server.'
      : '伺服器未更新（找不到天氣 API）。請重啟/更新後端。';
  }
  if (status === 502) {
    return lang === 'en'
      ? 'Hong Kong Observatory data is temporarily unavailable.'
      : '天文台暫時未能提供資料。';
  }
  if (anyErr?.name === 'TypeError') {
    return lang === 'en' ? 'Failed to connect to server.' : '未能連接到伺服器。';
  }
  return lang === 'en' ? 'Failed to load nearby weather.' : '未能取得附近天氣。';
}

function getHkoWarningIconUrl(code: string) {
  if (/^TC/i.test(code)) {
    return `https://www.hko.gov.hk/en/wxinfo/climat/warn/images/tc${code.slice(2).toLowerCase()}.gif`;
  }
  return `https://www.hko.gov.hk/en/wxinfo/climat/warn/images/${code}.gif`;
}

function HkoWarningBadge({ code, name }: { code: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const label = name || code;
  if (failed) {
    return (
      <Badge variant="destructive" className="text-[10px] tracking-widest uppercase" title={label}>
        {code}
      </Badge>
    );
  }
  return (
    <Badge
      variant="destructive"
      className="h-6 w-6 p-0 flex items-center justify-center"
      title={label}
      aria-label={label}
    >
      <img
        src={getHkoWarningIconUrl(code)}
        alt={label}
        className="h-4 w-4 object-contain"
        onError={() => setFailed(true)}
      />
    </Badge>
  );
}

export default function Dashboard() {
  const { currentUser, teams, events, venues, publicMatches, deletePublicMatch } = useAppStore();
  const { t, lang } = useI18n();
  const aggStats = getAggregatedStats(currentUser);
  const myTeams = teams.filter(t => t.memberIds.includes(currentUser.id));
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const fallbackLocation = useMemo(() => ({ lat: 22.3020278, lng: 114.1743333 }), []);
  const weatherLocation = userLocation ?? fallbackLocation;

  useEffect(() => {
    setLocationLoading(true);
    getUserLocation()
      .then(pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      })
      .catch(() => {})
      .finally(() => setLocationLoading(false));
  }, []);

  const nearbyWeatherQ = useQuery({
    queryKey: ['nearbyWeather', weatherLocation.lat, weatherLocation.lng, lang],
    queryFn: () =>
      api<NearbyWeatherResponse>(
        `/weather/nearby?lat=${weatherLocation.lat}&lng=${weatherLocation.lng}&lang=${lang === 'en' ? 'en' : 'tc'}`,
      ),
    refetchInterval: 10 * 60 * 1000,
  });

  const requestLocation = () => {
    setLocationLoading(true);
    getUserLocation()
      .then(pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      })
      .catch(() => {})
      .finally(() => setLocationLoading(false));
    nearbyWeatherQ.refetch();
  };

  const warnings = useMemo(() => {
    return nearbyWeatherQ.data?.warnings ?? [];
  }, [nearbyWeatherQ.data?.warnings]);

  const weatherErrorText = useMemo(() => {
    if (!nearbyWeatherQ.isError) return null;
    return getWeatherErrorText(nearbyWeatherQ.error, lang === 'en' ? 'en' : 'tc');
  }, [nearbyWeatherQ.error, nearbyWeatherQ.isError, lang]);

  const attendingTeamEvents = events
    .filter(e => e.status === 'scheduled' && e.attendingIds.includes(currentUser.id));

  const joinedPublicMatches = publicMatches
    .filter(m => m.attendees.includes(currentUser.id) && m.status === 'open');

  const upcomingEvents = [
    ...attendingTeamEvents.map(e => ({ ...e, eventType: 'team' as const })),
    ...joinedPublicMatches.map(m => {
      const venue = m.venueId ? venues.find(v => v.id === m.venueId) : undefined;
      const baseTitle = lang === 'en'
        ? (venue?.nameEn ?? m.venueAddressEn ?? m.venueAddress ?? t('publicMatch'))
        : (venue?.name ?? m.venueAddress ?? t('publicMatch'));
      const shouldAppendCourt =
        !!venue &&
        !!m.venueAddress &&
        m.venueAddress !== venue.address &&
        m.venueAddress !== venue.addressEn &&
        m.venueAddress !== venue.name &&
        m.venueAddress !== venue.nameEn;
      return { 
        ...m, 
        eventType: 'public' as const, 
        title: shouldAppendCourt
          ? `${lang === 'en' ? (venue!.nameEn ?? venue!.name) : venue!.name} · ${m.venueAddress}`
          : baseTitle
      };
    })
  ]
    .sort((a, b) => safeDate(a.datetime).getTime() - safeDate(b.datetime).getTime())
    .slice(0, 3);
  
  const nearbyMatches = publicMatches
    .filter(m => m.status === 'open' && !m.attendees.includes(currentUser.id))
    .filter(m => {
      // Filter out past matches
      const matchDateStr = safeDate(m.datetime).toLocaleDateString('en-CA', { timeZone: 'Asia/Hong_Kong' });
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Hong_Kong' });
      return matchDateStr >= todayStr;
    })
    .sort((a, b) => {
      if (userLocation) {
        const vA = venues.find(v => v.id === a.venueId);
        const vB = venues.find(v => v.id === b.venueId);
        if (vA && vB) {
          const dA = getDistance(userLocation.lat, userLocation.lng, vA.lat, vA.lng);
          const dB = getDistance(userLocation.lat, userLocation.lng, vB.lat, vB.lng);
          return dA - dB;
        }
      }
      return safeDate(a.datetime).getTime() - safeDate(b.datetime).getTime();
    })
    .slice(0, 4);

  const myHostedMatches = publicMatches
    .filter(m => m.hostId === currentUser.id && m.status !== 'finished')
    .sort((a, b) => safeDate(a.datetime).getTime() - safeDate(b.datetime).getTime());

  // AI Recommendation Logic
  const aiRecommendation = useMemo(() => {
    // 1. Get user history (joined matches)
    const myHistory = publicMatches.filter(m => m.attendees.includes(currentUser.id));
    if (myHistory.length === 0) return null;

    // 2. Find frequent districts
    const districtCounts: Record<string, number> = {};
    myHistory.forEach(m => {
      const v = venues.find(ven => ven.id === m.venueId);
      const d = v?.district || m.district;
      if (d) districtCounts[d] = (districtCounts[d] || 0) + 1;
    });
    const topDistrict = Object.entries(districtCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    // 3. Find matches in top district that user hasn't joined
    const recommendation = publicMatches.find(m => 
      m.status === 'open' && 
      !m.attendees.includes(currentUser.id) && 
      (venues.find(v => v.id === m.venueId)?.district === topDistrict || m.district === topDistrict) &&
      safeDate(m.datetime).getTime() > Date.now()
    );

    if (!recommendation) return null;

    const districtName = lang === 'en' ? (districtTranslations[topDistrict] || topDistrict) : topDistrict;
    return { match: recommendation, reason: t('aiReasonDistrict').replace('{district}', districtName) };
  }, [currentUser.id, publicMatches, venues, lang, t]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <OnboardingTour />
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">
            {t('welcome')}, <span className="text-primary">{currentUser.name}</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-2">{t('readyForMatch')}</p>
        </div>
        <div className="flex gap-4">
          <Card className="px-6 py-4 border-border bg-card/50 backdrop-blur text-center">
            <div className="text-sm text-muted-foreground font-bold tracking-wider uppercase mb-1">{t('seasonGoals')}</div>
            <div className="text-3xl font-display font-bold text-primary">{aggStats.goals}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 tracking-wider">{t('allTeams')}</div>
          </Card>
          <Card className="px-6 py-4 border-border bg-card/50 backdrop-blur text-center">
            <div className="text-sm text-muted-foreground font-bold tracking-wider uppercase mb-1">{t('avgAttendance')}</div>
            <div className="text-3xl font-display font-bold text-white">{aggStats.attendance}%</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 tracking-wider">{t('allTeams')}</div>
          </Card>
        </div>
      </header>

      <Card className="p-6 border-border bg-card/50 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground font-bold tracking-wider uppercase mb-1">
              {lang === 'en' ? 'Nearby Weather' : '附近天氣'}
            </div>
            <div className="text-xs text-muted-foreground">
              {lang === 'en' ? 'Refreshes every 10 minutes' : '每 10 分鐘更新'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={locationLoading}
              onClick={requestLocation}
              aria-label={lang === 'en' ? (userLocation ? 'Refresh location' : 'Enable location') : (userLocation ? '更新定位' : '允許定位')}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            {nearbyWeatherQ.isFetching && <Spinner className="text-muted-foreground" />}
          </div>
        </div>

        {!userLocation && (
          <div className="mt-3 text-xs text-muted-foreground">
            {lang === 'en'
              ? 'Location not enabled. Showing weather near Hong Kong Observatory.'
              : '未開定位：顯示香港天文台附近天氣。'}
          </div>
        )}

        {nearbyWeatherQ.isLoading ? (
          <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
            <Spinner className="text-muted-foreground" />
            {lang === 'en' ? 'Loading...' : '載入中...'}
          </div>
        ) : nearbyWeatherQ.isError ? (
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              {weatherErrorText}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={nearbyWeatherQ.isFetching}
              onClick={() => nearbyWeatherQ.refetch()}
            >
              {lang === 'en' ? 'Retry' : '重試'}
            </Button>
          </div>
        ) : (
          <div data-testid="weather-metrics-grid" className="mt-5 grid grid-cols-4 gap-4 items-stretch">
            <div className="rounded-xl border border-border bg-black/20 p-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                  {lang === 'en' ? 'Temperature' : '溫度'}
                </div>
                <div className="text-2xl font-display font-bold text-primary mt-1">
                  {nearbyWeatherQ.data?.temperature != null
                    ? `${nearbyWeatherQ.data.temperature.value}°${nearbyWeatherQ.data.temperature.unit}`
                    : '—'}
                </div>
                {nearbyWeatherQ.data?.temperature?.station && (
                  <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[140px]">
                    {nearbyWeatherQ.data.temperature.station}
                  </div>
                )}
              </div>
              <Thermometer className="w-6 h-6 text-primary/80" />
            </div>

            <div className="rounded-xl border border-border bg-black/20 p-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                  {lang === 'en' ? 'Humidity' : '濕度'}
                </div>
                <div className="text-2xl font-display font-bold text-white mt-1">
                  {nearbyWeatherQ.data?.humidity != null ? `${nearbyWeatherQ.data.humidity.value}%` : '—'}
                </div>
              </div>
              <Droplets className="w-6 h-6 text-white/70" />
            </div>

            <div className="rounded-xl border border-border bg-black/20 p-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                  {lang === 'en' ? 'Rainfall' : '雨量'}
                </div>
                <div className="text-2xl font-display font-bold text-white mt-1">
                  {nearbyWeatherQ.data?.rainfall != null ? `${nearbyWeatherQ.data.rainfall.max}mm` : '—'}
                </div>
                {nearbyWeatherQ.data?.rainfall?.district && (
                  <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[140px]">
                    {userLocation ? nearbyWeatherQ.data.rainfall.district : (lang === 'en' ? 'Near HKO' : '天文台附近')}
                  </div>
                )}
              </div>
              <CloudRain className="w-6 h-6 text-white/70" />
            </div>

            <div className="rounded-xl border border-border bg-black/20 p-4 flex flex-col justify-between gap-2">
              <div className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                {lang === 'en' ? 'Alerts' : '警告'}
              </div>
              {warnings.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {warnings.slice(0, 8).map((w) => (
                    <HkoWarningBadge key={`${w.code}-${w.name}`} code={w.code} name={w.name} />
                  ))}
                </div>
              ) : (
                <Badge variant="outline" className="text-[10px] tracking-widest uppercase text-muted-foreground">
                  {lang === 'en' ? 'No alerts' : '無警告'}
                </Badge>
              )}
            </div>
          </div>
        )}
      </Card>
      
      {/* AI Recommendation Section */}
      {aiRecommendation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <Card className="relative p-6 border-primary/20 bg-black/60 backdrop-blur-xl border-2 overflow-hidden group">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0 animate-pulse">
                <Compass className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <Badge className="mb-2 bg-primary text-primary-foreground font-bold tracking-widest uppercase text-[10px]">✨ {t('aiRecommendation')}</Badge>
                <h3 className="text-xl font-bold mb-1">
                  {t('dashboardAIWeek')}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {aiRecommendation.reason}
                </p>
              </div>
              <div className="flex flex-col items-center md:items-end gap-2">
                <div className="text-xs font-bold text-primary uppercase tracking-widest">
                  {(() => {
                    const v = venues.find(x => x.id === aiRecommendation.match.venueId);
                    const base = (lang === 'en'
                      ? (v?.nameEn ?? aiRecommendation.match.venueAddressEn ?? aiRecommendation.match.venueAddress)
                      : (v?.name ?? aiRecommendation.match.venueAddress)
                    ) || '—';
                    const shouldAppendCourt =
                      !!v &&
                      !!aiRecommendation.match.venueAddress &&
                      aiRecommendation.match.venueAddress !== v.address &&
                      aiRecommendation.match.venueAddress !== v.addressEn &&
                      aiRecommendation.match.venueAddress !== v.name &&
                      aiRecommendation.match.venueAddress !== v.nameEn;
                    if (shouldAppendCourt) {
                      return `${lang === 'en' ? (v!.nameEn ?? v!.name) : v!.name} · ${aiRecommendation.match.venueAddress}`;
                    }
                    return base;
                  })()}
                </div>
                <Link href={`/discover/${aiRecommendation.match.id}`}>
                  <Button size="lg" className="font-bold tracking-wider uppercase group-hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                    {t('viewDetail')} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
          </Card>
        </motion.div>
      )}

      <div className="space-y-8">

          {/* My Teams quick access */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" /> {t('myTeams')}
              </h2>
              <Link href="/teams" className="text-sm text-primary font-bold hover:underline uppercase tracking-wider">{t('allTeamsLink')}</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {myTeams.slice(0, 6).map((team, i) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="shrink-0"
                >
                  <Link href={`/teams/${team.id}`}>
                    <Card className="w-36 p-3 border-border bg-card/50 backdrop-blur hover:border-primary/50 transition-colors cursor-pointer group text-center">
                      <div className="w-16 h-16 mx-auto rounded-xl bg-black overflow-hidden relative mb-3">
                        {team.logoUrl ? <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" /> : <div className="w-full h-full bg-white/10" />}
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl" />
                      </div>
                      <div className="font-bold text-sm leading-tight truncate">{team.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{team.memberIds.length} {t('people')}</div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
              <Link href="/teams" className="shrink-0">
                <Card className="w-36 h-full min-h-[148px] p-3 border-dashed border-border bg-card/20 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer flex flex-col items-center justify-center text-muted-foreground hover:text-primary">
                  <Plus className="w-8 h-8 mb-2" />
                  <div className="text-xs font-bold tracking-wider uppercase">{t('addTeam')}</div>
                </Card>
              </Link>
            </div>
          </div>

          {/* Hosted matches inline */}
          {myHostedMatches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide">{t('hostYourMatch')}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myHostedMatches.map(m => {
                  const venue = venues.find(v => v.id === m.venueId);
                  const baseLabel = lang === 'en' ? (venue?.nameEn ?? m.venueAddressEn ?? m.venueAddress ?? '—') : (venue?.name ?? m.venueAddress ?? '—');
                  const shouldAppendCourt =
                    !!venue &&
                    !!m.venueAddress &&
                    m.venueAddress !== venue.address &&
                    m.venueAddress !== venue.addressEn &&
                    m.venueAddress !== venue.name &&
                    m.venueAddress !== venue.nameEn;
                  const label = shouldAppendCourt
                    ? `${lang === 'en' ? (venue!.nameEn ?? venue!.name) : venue!.name} · ${m.venueAddress}`
                    : baseLabel;
                  return (
                    <div key={m.id} className="relative h-full group/card">
                      <Link href={`/discover/${m.id}`}>
                        <Card className="p-4 border-primary/30 bg-primary/5 cursor-pointer hover:border-primary transition-colors h-full relative overflow-hidden">
                          {m.status === 'cancelled' && (
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                              <Badge variant="destructive" className="uppercase tracking-widest font-bold rotate-[-12deg] scale-110">{t('statusCancelled')}</Badge>
                            </div>
                          )}
                          <div className="flex justify-between items-start mb-2">
                            <span className={`font-bold truncate ${m.status === 'cancelled' ? 'line-through text-muted-foreground' : ''}`}>{label}</span>
                            <Badge className="bg-primary text-primary-foreground">{m.attendees.length}{m.maxPlayers != null ? `/${m.maxPlayers}` : ''}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {safeDate(m.datetime).toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-HK', { month: 'short', day: 'numeric', weekday: 'short', timeZone: 'Asia/Hong_Kong' })} {formatTime(m.datetime)}
                            {m.endDatetime && (
                              <span> – {formatTime(m.endDatetime)}</span>
                            )}
                          </div>
                        </Card>
                      </Link>
                      {m.status === 'cancelled' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 opacity-0 group-hover/card:opacity-100 transition-opacity z-20 shadow-md"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              await deletePublicMatch(m.id);
                              // toast({ title: '已刪除' });
                            } catch(err: any) {
                              // error handling
                            }
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Public Matches Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide flex items-center gap-2">
                <Compass className="w-6 h-6 text-primary" /> {t('nearbyMatches')}
              </h2>
              <Link href="/discover" className="text-sm text-primary font-bold hover:underline uppercase tracking-wider">{t('discoverMore')}</Link>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {nearbyMatches.map((match, i) => {
                const venue = match.venueId ? venues.find(v => v.id === match.venueId) : undefined;
                const baseLabel = lang === 'en' ? (venue?.nameEn ?? match.venueAddressEn ?? match.venueAddress ?? '—') : (venue?.name ?? match.venueAddress ?? '—');
                const shouldAppendCourt =
                  !!venue &&
                  !!match.venueAddress &&
                  match.venueAddress !== venue.address &&
                  match.venueAddress !== venue.addressEn &&
                  match.venueAddress !== venue.name &&
                  match.venueAddress !== venue.nameEn;
                const label = shouldAppendCourt
                  ? `${lang === 'en' ? (venue!.nameEn ?? venue!.name) : venue!.name} · ${match.venueAddress}`
                  : baseLabel;
                const district = lang === 'en' ? (venue?.districtEn ?? (match.venueAddress ? districtTranslations[detectDistrict(match.venueAddress)] : t('discoverOther'))) : (venue?.district ?? (match.venueAddress ? detectDistrict(match.venueAddress) : t('discoverOther')));
                return (
                  <motion.div key={match.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Link href={`/discover/${match.id}`}>
                      <Card className="p-5 border-border hover:border-primary/50 transition-colors bg-card/50 backdrop-blur cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 tracking-widest uppercase">{t('publicMatch')}</Badge>
                          <div className="text-sm font-bold">${match.fee}</div>
                        </div>
                        <h3 className="font-bold text-lg leading-tight mb-2 truncate">{label}</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {district || t('dashboardNeedAddress')}</div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {safeDate(match.datetime).toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-HK', { month: 'short', day: 'numeric', weekday: 'short', timeZone: 'Asia/Hong_Kong' })} {formatTime(match.datetime)}
                            {match.endDatetime && (
                              <span> – {formatTime(match.endDatetime)}</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs font-bold text-primary group-hover:text-white transition-colors">
                          <div className="flex items-center gap-1">
                            <span>{match.attendees.length}{match.maxPlayers != null ? ` / ${match.maxPlayers}` : ''} {t('spotsRegistered')}</span>
                            {userLocation && venue && (
                              <span className="text-muted-foreground font-normal ml-2">
                                · {getDistance(userLocation.lat, userLocation.lng, venue.lat, venue.lng).toFixed(1)}km
                              </span>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}

              {nearbyMatches.length === 0 && (
                <Card className="p-8 col-span-2 text-center border-dashed border-border bg-card/30">
                  <p className="text-muted-foreground mb-4">{t('noNearbyMatches')}</p>
                  <Link href="/discover/host"><Button variant="outline">{t('firstHost')}</Button></Link>
                </Card>
              )}
            </div>
          </div>

          {/* Team Events Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide">{t('upcomingEvents')}</h2>
              <Link href="/events" className="text-sm text-primary font-bold hover:underline uppercase tracking-wider">{t('allTeamsLink')}</Link>
            </div>
            
            <div className="space-y-4">
              {upcomingEvents.map((event, i) => {
                const isTeam = event.eventType === 'team';
                const venue = event.venueId ? venues.find(v => v.id === event.venueId) : null;
                const baseVenueLabel = lang === 'en' ? (venue?.nameEn ?? event.venueAddress ?? '—') : (venue?.name ?? event.venueAddress ?? '—');
                const shouldAppendCourt =
                  !!venue &&
                  !!event.venueAddress &&
                  event.venueAddress !== venue.address &&
                  event.venueAddress !== venue.addressEn &&
                  event.venueAddress !== venue.name &&
                  event.venueAddress !== venue.nameEn;
                const venueLabel = shouldAppendCourt
                  ? `${lang === 'en' ? (venue!.nameEn ?? venue!.name) : venue!.name} · ${event.venueAddress}`
                  : baseVenueLabel;
                const team = isTeam ? teams.find(t => t.id === event.teamId) : null;
                const isAttending = isTeam 
                  ? event.attendingIds.includes(currentUser.id)
                  : event.attendees.includes(currentUser.id);
                const hasCap = (isTeam ? event.capacity : event.maxPlayers) != null;
                const capacity = isTeam ? event.capacity : event.maxPlayers;
                const attendeesCount = isTeam ? event.attendingIds.length : event.attendees.length;
                const detailUrl = isTeam ? `/events/${event.id}` : `/discover/${event.id}`;
                
                return (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link href={detailUrl}>
                      <Card className="p-0 overflow-hidden border-border hover:border-primary/50 transition-all group bg-card/50 backdrop-blur cursor-pointer">
                        <div className="flex flex-col sm:flex-row">
                          <div className="p-6 sm:w-1/3 border-b sm:border-b-0 sm:border-r border-border bg-black/20 flex flex-col justify-center">
                            <div className="text-sm text-primary font-bold tracking-wider uppercase mb-2">
                              {safeDate(event.datetime).toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-HK', { month: 'short', day: 'numeric', weekday: 'short', timeZone: 'Asia/Hong_Kong' })}
                            </div>
                            <div className="text-3xl font-display font-bold">
                              {formatTime(event.datetime)}
                            </div>
                          </div>
                          <div className="p-6 flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={`text-[10px] tracking-widest uppercase ${isTeam ? 'bg-white/10 text-white' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                {isTeam ? (team?.name || t('teamEvent')) : t('publicMatch')}
                              </Badge>
                              {isAttending && <span className="text-xs font-bold px-2 py-1 rounded bg-green-500/20 text-green-500 tracking-wider uppercase">{t('registered')}</span>}
                            </div>
                            <h3 className="text-xl font-bold mb-4">{event.title}</h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1 min-w-0"><MapPin className="w-4 h-4 shrink-0" /> <span className="truncate max-w-[200px]">{venueLabel}</span></div>
                              <div className="flex items-center gap-1"><Users className="w-4 h-4" /> {attendeesCount}{hasCap ? `/${capacity}` : ''} {t('pax')}{!hasCap && <span className="text-primary text-xs ml-1">{t('unlimited')}</span>}</div>
                              {event.fee === 0 && <span className="text-green-400 text-xs font-bold">{t('free')}</span>}
                              {!isTeam && event.fee > 0 && <span className="text-primary text-xs font-bold">${event.fee}</span>}
                            </div>
                          </div>
                          <div className="p-6 flex items-center justify-center sm:justify-end border-t sm:border-t-0 sm:border-l border-border bg-black/20">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
                              <ArrowRight className="w-6 h-6" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
      </div>
    </div>
  );
}
