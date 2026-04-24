import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  User, Team, Event, Venue, Notification, PublicMatch, HostProfile, MatchComment,
  Role, SeasonStats, EMPTY_SEASON_STATS,
} from './types';
import { api, ApiError } from './api';
import { toast } from '../hooks/use-toast';

export function getTeamStats(user: User, teamId: string): SeasonStats {
  return user.seasonStatsByTeam?.[teamId] ?? EMPTY_SEASON_STATS;
}

export function getAggregatedStats(user: User): SeasonStats {
  const teams = Object.values(user.seasonStatsByTeam ?? {});
  if (teams.length === 0) return EMPTY_SEASON_STATS;
  const sum = teams.reduce(
    (a, s) => ({
      goals: a.goals + s.goals,
      assists: a.assists + s.assists,
      yellow: a.yellow + s.yellow,
      red: a.red + s.red,
      matches: a.matches + s.matches,
      attendance: a.attendance + s.attendance,
    }),
    { goals: 0, assists: 0, yellow: 0, red: 0, matches: 0, attendance: 0 },
  );
  return { ...sum, attendance: Math.round(sum.attendance / teams.length) };
}

interface TeamMemberRow { teamId: string; userId: string; role: Role }

interface AppState {
  currentUser: User;
  users: User[];
  teams: Team[];
  events: Event[];
  venues: Venue[];
  notifications: Notification[];
  publicMatches: PublicMatch[];
  hostProfiles: HostProfile[];
  matchComments: MatchComment[];
  isProMode: boolean;
  hasTimeConflict: (start: string, end?: string, excludeEventId?: string, excludeMatchId?: string) => boolean;
}

interface AppContextType extends AppState {
  toggleProMode: () => void;
  updateEventRSVP: (eventId: string, status: 'attending' | 'declined' | 'none', ignoreConflict?: boolean) => void;
  acceptEventSlot: (eventId: string, offerId: string) => Promise<{ needPayment: boolean }>;
  payEventSlot: (eventId: string, offerId: string) => Promise<{ ok: boolean; reason?: string }>;
  declineEventSlot: (eventId: string, offerId: string) => void;
  acceptMatchSlot: (matchId: string, offerId: string) => Promise<{ needPayment: boolean }>;
  payMatchSlot: (matchId: string, offerId: string) => Promise<{ ok: boolean; reason?: string }>;
  declineMatchSlot: (matchId: string, offerId: string) => void;
  updateMatchStats: (eventId: string, userId: string, field: 'goals' | 'assists' | 'yellow' | 'red', delta: number) => void;
  markNotificationRead: (id: string) => void;
  joinPublicMatch: (matchId: string, ignoreConflict?: boolean) => void;
  leavePublicMatch: (matchId: string) => void;
  createPublicMatch: (match: Omit<PublicMatch, 'id' | 'hostId' | 'status' | 'createdAt' | 'attendees'>) => Promise<PublicMatch | void>;
  cancelPublicMatch: (matchId: string, reason?: string) => void;
  addMatchComment: (matchId: string, text: string) => void;
  updateCurrentUser: (patch: Partial<Pick<User, 'name' | 'avatarUrl'>>) => void;
  updateTeam: (teamId: string, patch: Partial<Pick<Team, 'name' | 'logoUrl' | 'accentColor' | 'district' | 'level'>>) => void;
  addTeam: (data: { name: string; district: string; level: number; accentColor?: string; logoUrl?: string }) => Promise<Team>;
  leaveTeam: (teamId: string) => void;
  removeMember: (teamId: string, userId: string) => void;
  setMemberRole: (teamId: string, userId: string, role: Role) => void;
  createEvent: (data: { teamId: string; title: string; datetime: string; endDatetime: string; venueAddress: string; surface?: import('./types').SurfaceType; skillLevel?: number; fee: number; capacity: number | null; description?: string; rules?: string }) => Promise<Event>;
  cancelEvent: (eventId: string, reason?: string) => void;
  getRole: (teamId: string) => Role | undefined;
  rateHost: (hostId: string, rating: number, comment?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const POLL_MS = 30_000;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const qc = useQueryClient();
  const [loc, setLoc] = useLocation();

  const meQ = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ user: User }>('/auth/me').then(r => r.user),
    retry: (count, err: any) => !(err instanceof ApiError && err.status === 401) && count < 2,
  });

  const enabled = !!meQ.data;

  const usersQ = useQuery({ queryKey: ['users'], queryFn: () => api<User[]>('/users'), enabled });
  const teamsQ = useQuery({ queryKey: ['teams'], queryFn: () => api<Team[]>('/teams'), enabled });
  const teamMembersQ = useQuery({ queryKey: ['teamMembers'], queryFn: () => api<TeamMemberRow[]>('/team-members'), enabled });
  const venuesQ = useQuery({ queryKey: ['venues'], queryFn: () => api<Venue[]>('/venues'), enabled });
  const eventsQ = useQuery({ queryKey: ['events'], queryFn: () => api<any[]>('/events'), enabled, refetchInterval: POLL_MS });
  const matchesQ = useQuery({ queryKey: ['publicMatches'], queryFn: () => api<any[]>('/public-matches'), enabled, refetchInterval: POLL_MS });
  const hostsQ = useQuery({ queryKey: ['hostProfiles'], queryFn: () => api<HostProfile[]>('/host-profiles'), enabled });
  const commentsQ = useQuery({ queryKey: ['matchComments'], queryFn: () => api<MatchComment[]>('/match-comments'), enabled });
  const notifsQ = useQuery({ queryKey: ['notifications'], queryFn: () => api<Notification[]>('/notifications'), enabled, refetchInterval: POLL_MS });

  // 401 → redirect to /login
  useEffect(() => {
    if (loc === '/pricing') return; // Allow public access to pricing pages
    if (meQ.isError && meQ.error instanceof ApiError && (meQ.error as ApiError).status === 401) {
      setLoc('/login');
    }
  }, [meQ.isError, meQ.error, setLoc, loc]);

  // Compose state
  const state: AppState | null = useMemo(() => {
    if (!meQ.data) return null;
    const teamMembers = teamMembersQ.data ?? [];
    const rolesByUser: Record<string, Record<string, Role>> = {};
    for (const m of teamMembers) (rolesByUser[m.userId] ??= {})[m.teamId] = m.role;

    const hydrateUser = (u: User): User => ({ ...u, role: rolesByUser[u.id] ?? {} });
    const users = (usersQ.data ?? []).map(hydrateUser);
    const me = users.find(u => u.id === meQ.data!.id) ?? hydrateUser(meQ.data);

    const hydrateEvent = (e: any): Event => ({
      ...e,
      datetime: typeof e.datetime === 'string' ? e.datetime : new Date(e.datetime).toISOString(),
      endDatetime: e.endDatetime ? (typeof e.endDatetime === 'string' ? e.endDatetime : new Date(e.endDatetime).toISOString()) : undefined,
      attendingIds: e.attendingIds ?? [],
      declinedIds: e.declinedIds ?? [],
      waitlistIds: e.waitlistIds ?? [],
      slotOffers: e.slotOffers ?? [],
      playerStats: e.playerStats ?? [],
    });
    const hydrateMatch = (m: any): PublicMatch => ({
      ...m,
      datetime: typeof m.datetime === 'string' ? m.datetime : new Date(m.datetime).toISOString(),
      endDatetime: m.endDatetime ? (typeof m.endDatetime === 'string' ? m.endDatetime : new Date(m.endDatetime).toISOString()) : undefined,
      attendees: m.attendees ?? [],
      waitlistIds: m.waitlistIds ?? [],
      slotOffers: m.slotOffers ?? [],
    });
    const hydrateNotif = (n: any): Notification => ({
      ...n,
      createdAt: typeof n.createdAt === 'string' ? n.createdAt : new Date(n.createdAt).toISOString(),
    });
    const hydrateComment = (c: any): MatchComment => ({
      ...c,
      createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date(c.createdAt).toISOString(),
    });

    const hasTimeConflict = (start: string, end?: string, excludeEventId?: string, excludeMatchId?: string) => {
      const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;
      const getEndMs = (d: string, e?: string) => e ? new Date(e).getTime() : new Date(d).getTime() + DEFAULT_DURATION_MS;
      
      const s1 = new Date(start).getTime();
      const e1 = getEndMs(start, end);
      
      const checkOverlap = (s2: number, e2: number) => s1 < e2 && e1 > s2;

      for (const ev of (eventsQ.data ?? []).map(hydrateEvent)) {
        if (ev.id === excludeEventId) continue;
        if (ev.attendingIds.includes(me.id)) {
          if (checkOverlap(new Date(ev.datetime).getTime(), getEndMs(ev.datetime, ev.endDatetime))) return true;
        }
      }

      for (const m of (matchesQ.data ?? []).map(hydrateMatch)) {
        if (m.id === excludeMatchId) continue;
        if (m.attendees.includes(me.id)) {
          if (checkOverlap(new Date(m.datetime).getTime(), getEndMs(m.datetime, m.endDatetime))) return true;
        }
      }
      return false;
    };

    return {
      currentUser: me,
      users,
      teams: teamsQ.data ?? [],
      events: (eventsQ.data ?? []).map(hydrateEvent),
      venues: venuesQ.data ?? [],
      notifications: (notifsQ.data ?? []).map(hydrateNotif),
      publicMatches: (matchesQ.data ?? []).map(hydrateMatch),
      hostProfiles: hostsQ.data ?? [],
      matchComments: (commentsQ.data ?? []).map(hydrateComment),
      isProMode: me.subscription === 'pro',
      hasTimeConflict,
    };
  }, [meQ.data, usersQ.data, teamsQ.data, teamMembersQ.data, venuesQ.data, eventsQ.data, matchesQ.data, hostsQ.data, commentsQ.data, notifsQ.data]);

  // Pro mode CSS vars
  useEffect(() => {
    if (!state) return;
    if (state.isProMode) {
      document.documentElement.style.setProperty('--primary', '72 100% 50%');
      document.documentElement.style.setProperty('--ring', '72 100% 50%');
    } else {
      document.documentElement.style.setProperty('--primary', '220 14% 96%');
      document.documentElement.style.setProperty('--ring', '220 14% 96%');
    }
  }, [state?.isProMode]);

  // Mutation helpers
  const inv = (keys: string[]) => keys.forEach(k => qc.invalidateQueries({ queryKey: [k] }));

  const toggleProMode = useCallback(async () => {
    await api('/me/pro-toggle', { method: 'POST' });
    inv(['me', 'users']);
  }, []);

  const updateEventRSVP = useCallback(async (eventId: string, status: 'attending' | 'declined' | 'none', ignoreConflict = false) => {
    const doRSVP = async (force: boolean) => {
      try {
        await api(`/events/${eventId}/rsvp`, { method: 'PUT', body: JSON.stringify({ status, ignoreConflict: force }) });
        inv(['events', 'notifications']);
      } catch (e: any) {
        if (e instanceof ApiError && e.status === 409) {
          if (window.confirm('時間衝突：您在該時段已有其他活動或比賽。是否繼續出席？')) {
            doRSVP(true);
          }
          return;
        }
        toast({ title: e?.body?.error ?? e?.message ?? '操作失敗', variant: 'destructive' });
      }
    };
    doRSVP(ignoreConflict);
  }, []);

  const acceptEventSlot = useCallback(async (eventId: string, offerId: string) => {
    const r = await api<{ needPayment: boolean }>(`/events/${eventId}/slot-offers/${offerId}/accept`, { method: 'POST' });
    inv(['events', 'notifications']);
    return r;
  }, []);

  const payEventSlot = useCallback(async (eventId: string, offerId: string) => {
    try {
      const r = await api<{ ok: boolean; reason?: string }>(`/events/${eventId}/slot-offers/${offerId}/pay`, { method: 'POST' });
      inv(['events', 'notifications']);
      return r;
    } catch (err: any) {
      return { ok: false, reason: err?.body?.reason ?? 'error' };
    }
  }, []);

  const declineEventSlot = useCallback(async (eventId: string, offerId: string) => {
    await api(`/events/${eventId}/slot-offers/${offerId}/decline`, { method: 'POST' });
    inv(['events', 'notifications']);
  }, []);

  const acceptMatchSlot = useCallback(async (matchId: string, offerId: string) => {
    const r = await api<{ needPayment: boolean }>(`/public-matches/${matchId}/slot-offers/${offerId}/accept`, { method: 'POST' });
    inv(['publicMatches', 'notifications']);
    return r;
  }, []);

  const payMatchSlot = useCallback(async (matchId: string, offerId: string) => {
    try {
      const r = await api<{ ok: boolean; reason?: string }>(`/public-matches/${matchId}/slot-offers/${offerId}/pay`, { method: 'POST' });
      inv(['publicMatches', 'notifications']);
      return r;
    } catch (err: any) {
      return { ok: false, reason: err?.body?.reason ?? 'error' };
    }
  }, []);

  const declineMatchSlot = useCallback(async (matchId: string, offerId: string) => {
    await api(`/public-matches/${matchId}/slot-offers/${offerId}/decline`, { method: 'POST' });
    inv(['publicMatches', 'notifications']);
  }, []);

  const updateMatchStats = useCallback(async (eventId: string, userId: string, field: 'goals' | 'assists' | 'yellow' | 'red', delta: number) => {
    await api(`/events/${eventId}/stats`, { method: 'PATCH', body: JSON.stringify({ userId, field, delta }) });
    inv(['events']);
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    await api(`/notifications/${id}/read`, { method: 'POST' });
    inv(['notifications']);
  }, []);

  const joinPublicMatch = useCallback(async (matchId: string, ignoreConflict = false) => {
    const doJoin = async (force: boolean) => {
      try {
        await api(`/public-matches/${matchId}/join`, { method: 'POST', body: JSON.stringify({ ignoreConflict: force }) });
        inv(['publicMatches', 'notifications']);
      } catch (e: any) {
        if (e instanceof ApiError && e.status === 409) {
          if (window.confirm('時間衝突：您在該時段已有其他活動或比賽。是否繼續報名？')) {
            doJoin(true);
          }
          return;
        }
        toast({ title: e?.body?.error ?? e?.message ?? '操作失敗', variant: 'destructive' });
      }
    };
    doJoin(ignoreConflict);
  }, []);

  const leavePublicMatch = useCallback(async (matchId: string) => {
    await api(`/public-matches/${matchId}/leave`, { method: 'POST' });
    inv(['publicMatches', 'notifications']);
  }, []);

  const createPublicMatch = useCallback(async (matchData: Omit<PublicMatch, 'id' | 'hostId' | 'status' | 'createdAt' | 'attendees'>) => {
    const created = await api<PublicMatch>('/public-matches', { method: 'POST', body: JSON.stringify(matchData) });
    inv(['publicMatches']);
    return created;
  }, []);

  const cancelPublicMatch = useCallback(async (matchId: string, reason?: string) => {
    await api(`/public-matches/${matchId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
    inv(['publicMatches']);
  }, []);

  const addMatchComment = useCallback(async (matchId: string, text: string) => {
    await api(`/public-matches/${matchId}/comments`, { method: 'POST', body: JSON.stringify({ text }) });
    inv(['matchComments']);
  }, []);

  const updateCurrentUser = useCallback(async (patch: Partial<Pick<User, 'name' | 'avatarUrl'>>) => {
    await api('/me/profile', { method: 'PATCH', body: JSON.stringify(patch) });
    inv(['me', 'users']);
  }, []);

  const updateTeam = useCallback(async (teamId: string, patch: Partial<Pick<Team, 'name' | 'logoUrl' | 'accentColor' | 'district' | 'level'>>) => {
    await api(`/teams/${teamId}`, { method: 'PATCH', body: JSON.stringify(patch) });
    inv(['teams']);
  }, []);

  const addTeam = useCallback(async (data: { name: string; district: string; level: number; accentColor?: string; logoUrl?: string }) => {
    const team = await api<Team>('/teams', { method: 'POST', body: JSON.stringify(data) });
    inv(['teams', 'teamMembers']);
    return team;
  }, []);

  const leaveTeam = useCallback(async (teamId: string) => {
    await api(`/teams/${teamId}/leave`, { method: 'POST' });
    inv(['teams', 'teamMembers']);
  }, []);

  const removeMember = useCallback(async (teamId: string, userId: string) => {
    await api(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' });
    inv(['teams', 'teamMembers']);
  }, []);

  const setMemberRole = useCallback(async (teamId: string, userId: string, role: Role) => {
    await api(`/teams/${teamId}/members/${userId}`, { method: 'PATCH', body: JSON.stringify({ role }) });
    inv(['teamMembers']);
  }, []);

  const createEvent = useCallback(async (data: any) => {
    const ev = await api<Event>('/events', { method: 'POST', body: JSON.stringify(data) });
    inv(['events']);
    return ev;
  }, []);

  const cancelEvent = useCallback(async (eventId: string, reason?: string) => {
    await api(`/events/${eventId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
    inv(['events']);
  }, []);

  const rateHost = useCallback(async (hostId: string, rating: number, comment?: string) => {
    await api(`/host-profiles/${hostId}/rate`, { method: 'POST', body: JSON.stringify({ rating, comment }) });
    inv(['hostProfiles']);
  }, []);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' });
    qc.clear();
    setLoc('/login');
  }, [qc, setLoc]);

  const getRole = useCallback((teamId: string): Role | undefined => {
    return state?.currentUser.role[teamId];
  }, [state]);

  if (meQ.isLoading || (meQ.data && !state)) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-400">載入中…</div>;
  }
  if (!state && loc !== '/pricing') {
    // 401 effect above will navigate to /login
    return <div className="min-h-screen flex items-center justify-center text-zinc-400">前往登入…</div>;
  }

  // Provide mock context for public routes when not logged in
  const mockContextForPublic: AppContextType | undefined = !state ? {
    currentUser: { id: '', name: '訪客', avatarUrl: '', tokensBalance: 0, subscription: 'free', seasonStatsByTeam: {}, role: {} },
    users: [], teams: [], events: [], venues: [], notifications: [], publicMatches: [], hostProfiles: [], matchComments: [], isProMode: false,
    toggleProMode: () => {}, updateEventRSVP: () => {}, acceptEventSlot: async () => ({ needPayment: false }),
    payEventSlot: async () => ({ ok: false }), declineEventSlot: () => {}, acceptMatchSlot: async () => ({ needPayment: false }),
    payMatchSlot: async () => ({ ok: false }), declineMatchSlot: () => {}, updateMatchStats: () => {}, markNotificationRead: () => {},
    joinPublicMatch: () => {}, leavePublicMatch: () => {}, createPublicMatch: async () => {}, cancelPublicMatch: () => {},
    addMatchComment: () => {}, updateCurrentUser: () => {}, updateTeam: () => {}, addTeam: async () => ({ id: '', name: '', logoUrl: '', accentColor: '#84cc16', memberIds: [], record: { w: 0, d: 0, l: 0, gf: 0, ga: 0 }, isPro: false }),
    leaveTeam: () => {}, removeMember: () => {}, setMemberRole: () => {}, createEvent: async () => ({} as any), cancelEvent: () => {}, getRole: () => undefined, rateHost: async () => {}, hasTimeConflict: () => false, logout: async () => {},
  } : undefined;

  return (
    <AppContext.Provider value={state ? {
      ...state,
      toggleProMode,
      updateEventRSVP,
      acceptEventSlot,
      payEventSlot,
      declineEventSlot,
      acceptMatchSlot,
      payMatchSlot,
      declineMatchSlot,
      updateMatchStats,
      markNotificationRead,
      joinPublicMatch,
      leavePublicMatch,
      createPublicMatch,
      cancelPublicMatch,
      addMatchComment,
      updateCurrentUser,
      updateTeam,
      addTeam,
      leaveTeam,
      removeMember,
      setMemberRole,
      createEvent,
      cancelEvent,
      getRole,
      rateHost,
      logout,
    } : mockContextForPublic!}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
};
