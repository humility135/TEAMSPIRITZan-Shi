import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Team, Event, Venue, Notification, PublicMatch, HostProfile, MatchComment, Role, SeasonStats, SlotOffer, RACE_THRESHOLD_HOURS, PAYMENT_WINDOW_MINUTES, EMPTY_SEASON_STATS } from './types';
import { mockUsers, mockTeams, mockEvents, mockVenues, mockNotifications, mockPublicMatches, mockHostProfiles, mockMatchComments } from './mockData';

const hoursUntil = (iso: string): number => (new Date(iso).getTime() - Date.now()) / 3600000;
const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const makeNotif = (message: string): Notification => ({
  id: uid('n'), type: 'event', message, createdAt: new Date().toISOString(), read: false,
});
function makeSlotOffer(waitlistIds: string[], hoursLeft: number): SlotOffer | null {
  if (waitlistIds.length === 0) return null;
  const isRace = hoursLeft <= RACE_THRESHOLD_HOURS;
  return {
    id: uid('offer'),
    mode: isRace ? 'race' : 'fifo',
    eligibleUserIds: isRace ? [...waitlistIds] : waitlistIds.slice(0, 1),
    createdAt: new Date().toISOString(),
  };
}

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
    { goals: 0, assists: 0, yellow: 0, red: 0, matches: 0, attendance: 0 }
  );
  return { ...sum, attendance: Math.round(sum.attendance / teams.length) };
}

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
}

interface AppContextType extends AppState {
  toggleProMode: () => void;
  updateEventRSVP: (eventId: string, status: 'attending' | 'declined' | 'none') => void;
  acceptEventSlot: (eventId: string, offerId: string) => { needPayment: boolean };
  payEventSlot: (eventId: string, offerId: string) => { ok: boolean; reason?: string };
  declineEventSlot: (eventId: string, offerId: string) => void;
  acceptMatchSlot: (matchId: string, offerId: string) => { needPayment: boolean };
  payMatchSlot: (matchId: string, offerId: string) => { ok: boolean; reason?: string };
  declineMatchSlot: (matchId: string, offerId: string) => void;
  updateMatchStats: (eventId: string, userId: string, field: 'goals' | 'assists' | 'yellow' | 'red', delta: number) => void;
  markNotificationRead: (id: string) => void;
  joinPublicMatch: (matchId: string) => void;
  leavePublicMatch: (matchId: string) => void;
  createPublicMatch: (match: Omit<PublicMatch, 'id' | 'hostId' | 'status' | 'createdAt' | 'attendees'>) => void;
  cancelPublicMatch: (matchId: string) => void;
  addMatchComment: (matchId: string, text: string) => void;
  updateCurrentUser: (patch: Partial<Pick<User, 'name' | 'avatarUrl'>>) => void;
  updateTeam: (teamId: string, patch: Partial<Pick<Team, 'name' | 'logoUrl' | 'accentColor' | 'district' | 'level'>>) => void;
  addTeam: (data: { name: string; district: string; level: number; accentColor?: string; logoUrl?: string }) => Team;
  leaveTeam: (teamId: string) => void;
  removeMember: (teamId: string, userId: string) => void;
  setMemberRole: (teamId: string, userId: string, role: Role) => void;
  createEvent: (data: { teamId: string; title: string; datetime: string; endDatetime: string; venueAddress: string; surface?: import('./types').SurfaceType; skillLevel?: number; fee: number; capacity: number | null; description?: string; rules?: string }) => Event;
  getRole: (teamId: string) => Role | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('teamspirit_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          users: parsed.users || mockUsers,
          publicMatches: parsed.publicMatches || mockPublicMatches,
          hostProfiles: parsed.hostProfiles || mockHostProfiles,
          matchComments: parsed.matchComments || mockMatchComments,
        };
      } catch (e) {
        console.error('Failed to parse state', e);
      }
    }
    return {
      currentUser: mockUsers[0],
      users: mockUsers,
      teams: mockTeams,
      events: mockEvents,
      venues: mockVenues,
      notifications: mockNotifications,
      publicMatches: mockPublicMatches,
      hostProfiles: mockHostProfiles,
      matchComments: mockMatchComments,
      isProMode: mockUsers[0].subscription === 'pro'
    };
  });

  useEffect(() => {
    localStorage.setItem('teamspirit_state', JSON.stringify(state));
    
    if (state.isProMode) {
      document.documentElement.style.setProperty('--primary', '72 100% 50%');
      document.documentElement.style.setProperty('--ring', '72 100% 50%');
    } else {
      document.documentElement.style.setProperty('--primary', '220 14% 96%');
      document.documentElement.style.setProperty('--ring', '220 14% 96%');
    }
  }, [state]);

  const toggleProMode = () => {
    setState(s => {
      const isProMode = !s.isProMode;
      return {
        ...s,
        isProMode,
        currentUser: {
          ...s.currentUser,
          subscription: isProMode ? 'pro' : 'free'
        }
      };
    });
  };

  const updateEventRSVP = (eventId: string, status: 'attending' | 'declined' | 'none') => {
    setState(s => {
      const newNotifs: Notification[] = [];
      const events = s.events.map(e => {
        if (e.id !== eventId) return e;
        const me = s.currentUser.id;
        const wasAttending = e.attendingIds.includes(me);
        let attendingIds = e.attendingIds.filter(id => id !== me);
        let declinedIds = e.declinedIds.filter(id => id !== me);
        let waitlistIds = e.waitlistIds.filter(id => id !== me);
        let slotOffers = e.slotOffers.filter(o => o.acceptedBy !== me);
        slotOffers = slotOffers.map(o => ({ ...o, eligibleUserIds: o.eligibleUserIds.filter(id => id !== me) })).filter(o => o.eligibleUserIds.length > 0 || o.acceptedBy);

        const cap = e.capacity;
        if (status === 'attending') {
          if (cap === null || attendingIds.length < cap) attendingIds.push(me);
          else { waitlistIds.push(me); newNotifs.push(makeNotif(`已加入候補：${e.title}（第 ${waitlistIds.length} 位）`)); }
        }
        if (status === 'declined') declinedIds.push(me);

        // Drop triggers slot offer (exclude users tied to other active offers)
        if (wasAttending && status !== 'attending' && waitlistIds.length > 0 && (cap === null || attendingIds.length < cap)) {
          const tiedUp = new Set<string>(slotOffers.flatMap(o => [...o.eligibleUserIds, ...(o.acceptedBy ? [o.acceptedBy] : [])]));
          const freeWl = waitlistIds.filter(id => !tiedUp.has(id));
          if (freeWl.length > 0) {
            const hLeft = hoursUntil(e.datetime);
            if (e.fee === 0) {
              const promoted = freeWl[0];
              waitlistIds = waitlistIds.filter(id => id !== promoted);
              attendingIds.push(promoted);
              newNotifs.push(makeNotif(`你已自動補上：${e.title}（免費活動）`));
            } else {
              const offer = makeSlotOffer(freeWl, hLeft);
              if (offer) {
                slotOffers.push(offer);
                const label = offer.mode === 'race' ? '搶位中' : '輪到你';
                newNotifs.push(makeNotif(`【${label}】${e.title} 有位空出，1 小時內接受並付款，逾時下一位補上`));
              }
            }
          }
        }
        return { ...e, attendingIds, declinedIds, waitlistIds, slotOffers };
      });
      return { ...s, events, notifications: [...newNotifs, ...s.notifications] };
    });
  };

  const acceptEventSlot = (eventId: string, offerId: string): { needPayment: boolean } => {
    let needPayment = false;
    setState(s => {
      const newNotifs: Notification[] = [];
      const events = s.events.map(e => {
        if (e.id !== eventId) return e;
        const me = s.currentUser.id;
        const offer = e.slotOffers.find(o => o.id === offerId);
        if (!offer || !offer.eligibleUserIds.includes(me) || offer.acceptedBy) return e;
        if (e.fee === 0) {
          const attendingIds = [...e.attendingIds, me];
          const waitlistIds = e.waitlistIds.filter(id => id !== me);
          const slotOffers = e.slotOffers.filter(o => o.id !== offerId);
          newNotifs.push(makeNotif(`你已補上：${e.title}`));
          return { ...e, attendingIds, waitlistIds, slotOffers };
        }
        needPayment = true;
        const deadline = new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60000).toISOString();
        const slotOffers = e.slotOffers.map(o => o.id === offerId ? { ...o, acceptedBy: me, paymentDeadline: deadline, eligibleUserIds: [me] } : o);
        return { ...e, slotOffers };
      });
      return { ...s, events, notifications: [...newNotifs, ...s.notifications] };
    });
    return { needPayment };
  };

  const payEventSlot = (eventId: string, offerId: string): { ok: boolean; reason?: string } => {
    let result: { ok: boolean; reason?: string } = { ok: false, reason: 'not-found' };
    setState(s => {
      const newNotifs: Notification[] = [];
      const events = s.events.map(e => {
        if (e.id !== eventId) return e;
        const me = s.currentUser.id;
        const offer = e.slotOffers.find(o => o.id === offerId);
        if (!offer || offer.acceptedBy !== me) { result = { ok: false, reason: 'expired' }; return e; }
        if (offer.paymentDeadline && new Date(offer.paymentDeadline).getTime() < Date.now()) {
          result = { ok: false, reason: 'expired' }; return e;
        }
        if (e.capacity != null && e.attendingIds.length >= e.capacity) { result = { ok: false, reason: 'full' }; return e; }
        if (e.attendingIds.includes(me)) { result = { ok: true }; return e; }
        const attendingIds = [...e.attendingIds, me];
        const waitlistIds = e.waitlistIds.filter(id => id !== me);
        const slotOffers = e.slotOffers.filter(o => o.id !== offerId);
        newNotifs.push(makeNotif(`付款成功，已補上：${e.title}`));
        result = { ok: true };
        return { ...e, attendingIds, waitlistIds, slotOffers };
      });
      return { ...s, events, notifications: [...newNotifs, ...s.notifications] };
    });
    return result;
  };

  const declineEventSlot = (eventId: string, offerId: string) => {
    setState(s => {
      const newNotifs: Notification[] = [];
      const events = s.events.map(e => {
        if (e.id !== eventId) return e;
        const me = s.currentUser.id;
        const offer = e.slotOffers.find(o => o.id === offerId);
        if (!offer) return e;
        const waitlistIds = e.waitlistIds.filter(id => id !== me);
        let slotOffers = e.slotOffers.map(o => {
          if (o.id !== offerId) return o;
          // Reset accepted/deadline on decline; recompute eligible from updated waitlist
          const eligible = waitlistIds.length === 0 ? [] : (o.mode === 'race' ? [...waitlistIds] : waitlistIds.slice(0, 1));
          if (eligible.length > 0) newNotifs.push(makeNotif(`【補位再開】${e.title} — 1 小時內接受並付款`));
          return { ...o, acceptedBy: undefined, paymentDeadline: undefined, eligibleUserIds: eligible };
        }).filter(o => o.eligibleUserIds.length > 0 || o.acceptedBy);
        return { ...e, waitlistIds, slotOffers };
      });
      return { ...s, events, notifications: [...newNotifs, ...s.notifications] };
    });
  };

  const updateMatchStats = (eventId: string, userId: string, field: 'goals' | 'assists' | 'yellow' | 'red', delta: number) => {
    setState(s => {
      const events = s.events.map(e => {
        if (e.id === eventId) {
          let playerStats = [...e.playerStats];
          let stat = playerStats.find(ps => ps.userId === userId);
          if (!stat) {
            stat = { userId, goals: 0, assists: 0, yellow: 0, red: 0 };
            playerStats.push(stat);
          }
          stat[field] = Math.max(0, stat[field] + delta);
          return { ...e, playerStats };
        }
        return e;
      });
      return { ...s, events };
    });
  };

  const markNotificationRead = (id: string) => {
    setState(s => ({
      ...s,
      notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  };

  const joinPublicMatch = (matchId: string) => {
    setState(s => {
      const newNotifs: Notification[] = [];
      const matches = s.publicMatches.map(m => {
        if (m.id !== matchId) return m;
        const me = s.currentUser.id;
        if (m.attendees.includes(me) || m.waitlistIds.includes(me)) return m;
        const cap = m.maxPlayers;
        const hasRoom = cap == null || m.attendees.length < cap;
        if (hasRoom) {
          const attendees = [...m.attendees, me];
          return { ...m, attendees, status: cap != null && attendees.length >= cap ? 'full' as const : m.status };
        }
        const waitlistIds = [...m.waitlistIds, me];
        newNotifs.push(makeNotif(`已加入候補：公開場（第 ${waitlistIds.length} 位）`));
        return { ...m, waitlistIds };
      });
      return { ...s, publicMatches: matches, notifications: [...newNotifs, ...s.notifications] };
    });
  };

  const leavePublicMatch = (matchId: string) => {
    setState(s => {
      const newNotifs: Notification[] = [];
      const matches = s.publicMatches.map(m => {
        if (m.id !== matchId) return m;
        const me = s.currentUser.id;
        const wasAttending = m.attendees.includes(me);
        const attendees = m.attendees.filter(id => id !== me);
        let waitlistIds = m.waitlistIds.filter(id => id !== me);
        let slotOffers = m.slotOffers
          .filter(o => o.acceptedBy !== me)
          .map(o => ({ ...o, eligibleUserIds: o.eligibleUserIds.filter(id => id !== me) }))
          .filter(o => o.eligibleUserIds.length > 0 || o.acceptedBy);
        const cap = m.maxPlayers;
        let status: PublicMatch['status'] = m.status === 'full' ? 'open' : m.status;

        if (wasAttending && waitlistIds.length > 0 && (cap == null || attendees.length < cap)) {
          const tiedUp = new Set<string>(slotOffers.flatMap(o => [...o.eligibleUserIds, ...(o.acceptedBy ? [o.acceptedBy] : [])]));
          const freeWl = waitlistIds.filter(id => !tiedUp.has(id));
          if (freeWl.length > 0) {
            if (m.fee === 0) {
              const promoted = freeWl[0];
              waitlistIds = waitlistIds.filter(id => id !== promoted);
              attendees.push(promoted);
              if (cap != null && attendees.length >= cap) status = 'full' as const;
              newNotifs.push(makeNotif('你已自動補上公開場（免費活動）'));
            } else {
              const hLeft = hoursUntil(m.datetime);
              const offer = makeSlotOffer(freeWl, hLeft);
              if (offer) {
                slotOffers.push(offer);
                const label = offer.mode === 'race' ? '搶位中' : '輪到你';
                newNotifs.push(makeNotif(`【${label}】公開場有位空出，1 小時內接受並付款，逾時下一位補上`));
              }
            }
          }
        }
        return { ...m, attendees, waitlistIds, slotOffers, status };
      });
      return { ...s, publicMatches: matches, notifications: [...newNotifs, ...s.notifications] };
    });
  };

  const acceptMatchSlot = (matchId: string, offerId: string): { needPayment: boolean } => {
    let needPayment = false;
    setState(s => {
      const newNotifs: Notification[] = [];
      const matches = s.publicMatches.map(m => {
        if (m.id !== matchId) return m;
        const me = s.currentUser.id;
        const offer = m.slotOffers.find(o => o.id === offerId);
        if (!offer || !offer.eligibleUserIds.includes(me) || offer.acceptedBy) return m;
        if (m.fee === 0) {
          const attendees = [...m.attendees, me];
          const waitlistIds = m.waitlistIds.filter(id => id !== me);
          const slotOffers = m.slotOffers.filter(o => o.id !== offerId);
          newNotifs.push(makeNotif('你已補上公開場'));
          const cap = m.maxPlayers;
          return { ...m, attendees, waitlistIds, slotOffers, status: cap != null && attendees.length >= cap ? 'full' as const : m.status };
        }
        needPayment = true;
        const deadline = new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60000).toISOString();
        const slotOffers = m.slotOffers.map(o => o.id === offerId ? { ...o, acceptedBy: me, paymentDeadline: deadline, eligibleUserIds: [me] } : o);
        return { ...m, slotOffers };
      });
      return { ...s, publicMatches: matches, notifications: [...newNotifs, ...s.notifications] };
    });
    return { needPayment };
  };

  const payMatchSlot = (matchId: string, offerId: string): { ok: boolean; reason?: string } => {
    let result: { ok: boolean; reason?: string } = { ok: false, reason: 'not-found' };
    setState(s => {
      const newNotifs: Notification[] = [];
      const matches = s.publicMatches.map(m => {
        if (m.id !== matchId) return m;
        const me = s.currentUser.id;
        const offer = m.slotOffers.find(o => o.id === offerId);
        if (!offer || offer.acceptedBy !== me) { result = { ok: false, reason: 'expired' }; return m; }
        if (offer.paymentDeadline && new Date(offer.paymentDeadline).getTime() < Date.now()) {
          result = { ok: false, reason: 'expired' }; return m;
        }
        const cap = m.maxPlayers;
        if (cap != null && m.attendees.length >= cap) { result = { ok: false, reason: 'full' }; return m; }
        if (m.attendees.includes(me)) { result = { ok: true }; return m; }
        const attendees = [...m.attendees, me];
        const waitlistIds = m.waitlistIds.filter(id => id !== me);
        const slotOffers = m.slotOffers.filter(o => o.id !== offerId);
        newNotifs.push(makeNotif('付款成功，已補上公開場'));
        result = { ok: true };
        return { ...m, attendees, waitlistIds, slotOffers, status: cap != null && attendees.length >= cap ? 'full' as const : m.status };
      });
      return { ...s, publicMatches: matches, notifications: [...newNotifs, ...s.notifications] };
    });
    return result;
  };

  const declineMatchSlot = (matchId: string, offerId: string) => {
    setState(s => {
      const newNotifs: Notification[] = [];
      const matches = s.publicMatches.map(m => {
        if (m.id !== matchId) return m;
        const me = s.currentUser.id;
        const offer = m.slotOffers.find(o => o.id === offerId);
        if (!offer) return m;
        const waitlistIds = m.waitlistIds.filter(id => id !== me);
        let slotOffers = m.slotOffers.map(o => {
          if (o.id !== offerId) return o;
          const eligible = waitlistIds.length === 0 ? [] : (o.mode === 'race' ? [...waitlistIds] : waitlistIds.slice(0, 1));
          if (eligible.length > 0) newNotifs.push(makeNotif(`【補位再開】公開場 — 1 小時內接受並付款`));
          return { ...o, acceptedBy: undefined, paymentDeadline: undefined, eligibleUserIds: eligible };
        }).filter(o => o.eligibleUserIds.length > 0 || o.acceptedBy);
        return { ...m, waitlistIds, slotOffers };
      });
      return { ...s, publicMatches: matches, notifications: [...newNotifs, ...s.notifications] };
    });
  };

  // Tick: expire offers that passed payment deadline; re-open to next user
  useEffect(() => {
    const tick = () => {
      setState(s => {
        const now = Date.now();
        let changed = false;
        const newNotifs: Notification[] = [];

        const expireOffers = <T extends { slotOffers: SlotOffer[]; waitlistIds: string[]; datetime: string; title?: string }>(item: T): T => {
          const offers = [...item.slotOffers];
          const wl = [...item.waitlistIds];
          let local = false;
          for (let i = 0; i < offers.length; i++) {
            const o = offers[i];
            if (o.acceptedBy && o.paymentDeadline && new Date(o.paymentDeadline).getTime() < now) {
              const expired = o.acceptedBy;
              const idx = wl.indexOf(expired);
              if (idx >= 0) wl.splice(idx, 1);
              const eligible = wl.length === 0 ? [] : (o.mode === 'race' ? [...wl] : wl.slice(0, 1));
              if (eligible.length === 0) {
                offers.splice(i, 1); i--;
              } else {
                offers[i] = { ...o, acceptedBy: undefined, paymentDeadline: undefined, eligibleUserIds: eligible };
                newNotifs.push(makeNotif(`【補位再開】${item.title ?? '公開場'} — 1 小時內接受並付款`));
              }
              local = true;
            }
          }
          if (!local) return item;
          changed = true;
          return { ...item, slotOffers: offers, waitlistIds: wl };
        };

        const events = s.events.map(expireOffers);
        const publicMatches = s.publicMatches.map(expireOffers);
        if (!changed) return s;
        return { ...s, events, publicMatches, notifications: [...newNotifs, ...s.notifications] };
      });
    };
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const createPublicMatch = (matchData: Omit<PublicMatch, 'id' | 'hostId' | 'status' | 'createdAt' | 'attendees'>) => {
    setState(s => {
      const newMatch: PublicMatch = {
        ...matchData,
        id: `pm${Date.now()}`,
        hostId: s.currentUser.id,
        status: 'open',
        createdAt: new Date().toISOString(),
        attendees: [s.currentUser.id]
      };
      return { ...s, publicMatches: [...s.publicMatches, newMatch] };
    });
  };

  const cancelPublicMatch = (matchId: string) => {
    setState(s => {
      const matches = s.publicMatches.map(m => {
        if (m.id === matchId && m.hostId === s.currentUser.id) {
          return { ...m, status: 'cancelled' as const };
        }
        return m;
      });
      return { ...s, publicMatches: matches };
    });
  };

  const addMatchComment = (matchId: string, text: string) => {
    setState(s => {
      const newComment: MatchComment = {
        id: `c${Date.now()}`,
        matchId,
        userId: s.currentUser.id,
        text,
        createdAt: new Date().toISOString()
      };
      return { ...s, matchComments: [...s.matchComments, newComment] };
    });
  };

  const updateCurrentUser = (patch: Partial<Pick<User, 'name' | 'avatarUrl'>>) => {
    setState(s => ({
      ...s,
      currentUser: { ...s.currentUser, ...patch },
      users: s.users.map(u => u.id === s.currentUser.id ? { ...u, ...patch } : u)
    }));
  };

  const updateTeam = (teamId: string, patch: Partial<Pick<Team, 'name' | 'logoUrl' | 'accentColor'>>) => {
    setState(s => ({
      ...s,
      teams: s.teams.map(t => t.id === teamId ? { ...t, ...patch } : t)
    }));
  };

  const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

  const addTeam = (data: { name: string; district: string; level: number; accentColor?: string; logoUrl?: string }) => {
    const team: Team = {
      id: `t${Date.now()}`,
      name: data.name,
      logoUrl: data.logoUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(data.name)}`,
      accentColor: data.accentColor || '#84cc16',
      memberIds: [state.currentUser.id],
      record: { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
      isPro: false,
      district: data.district,
      level: data.level,
      inviteCode: genCode(),
    };
    setState(s => ({
      ...s,
      teams: [...s.teams, team],
      currentUser: { ...s.currentUser, role: { ...s.currentUser.role, [team.id]: 'Owner' } },
      users: s.users.map(u => u.id === s.currentUser.id ? { ...u, role: { ...u.role, [team.id]: 'Owner' } } : u),
    }));
    return team;
  };

  const leaveTeam = (teamId: string) => {
    setState(s => {
      const newRole = { ...s.currentUser.role };
      delete newRole[teamId];
      return {
        ...s,
        teams: s.teams.map(t => t.id === teamId ? { ...t, memberIds: t.memberIds.filter(id => id !== s.currentUser.id) } : t),
        currentUser: { ...s.currentUser, role: newRole },
        users: s.users.map(u => {
          if (u.id !== s.currentUser.id) return u;
          const r = { ...u.role }; delete r[teamId];
          return { ...u, role: r };
        }),
      };
    });
  };

  const removeMember = (teamId: string, userId: string) => {
    setState(s => ({
      ...s,
      teams: s.teams.map(t => t.id === teamId ? { ...t, memberIds: t.memberIds.filter(id => id !== userId) } : t),
      users: s.users.map(u => {
        if (u.id !== userId) return u;
        const r = { ...u.role }; delete r[teamId];
        return { ...u, role: r };
      }),
    }));
  };

  const setMemberRole = (teamId: string, userId: string, role: Role) => {
    setState(s => ({
      ...s,
      users: s.users.map(u => u.id === userId ? { ...u, role: { ...u.role, [teamId]: role } } : u),
      currentUser: s.currentUser.id === userId ? { ...s.currentUser, role: { ...s.currentUser.role, [teamId]: role } } : s.currentUser,
    }));
  };

  const createEvent = (data: Parameters<AppContextType['createEvent']>[0]) => {
    const ev: Event = {
      id: `e${Date.now()}`,
      teamId: data.teamId,
      title: data.title,
      datetime: data.datetime,
      endDatetime: data.endDatetime,
      venueAddress: data.venueAddress,
      surface: data.surface,
      skillLevel: data.skillLevel,
      fee: data.fee,
      capacity: data.capacity,
      description: data.description,
      rules: data.rules,
      status: 'scheduled',
      attendingIds: [state.currentUser.id],
      declinedIds: [],
      waitlistIds: [],
      slotOffers: [],
      playerStats: [],
    };
    setState(s => ({ ...s, events: [...s.events, ev] }));
    return ev;
  };

  const getRole = (teamId: string): Role | undefined => state.currentUser.role[teamId];

  return (
    <AppContext.Provider value={{
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
      getRole,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
};
