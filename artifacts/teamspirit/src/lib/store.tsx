import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Team, Event, Venue, Notification, PublicMatch, HostProfile, MatchComment, Role, SeasonStats, EMPTY_SEASON_STATS } from './types';
import { mockUsers, mockTeams, mockEvents, mockVenues, mockNotifications, mockPublicMatches, mockHostProfiles, mockMatchComments } from './mockData';

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
  updateEventRSVP: (eventId: string, status: 'attending' | 'declined' | 'waitlist' | 'none') => void;
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
  createEvent: (data: { teamId: string; title: string; datetime: string; endDatetime: string; venueAddress: string; surface?: import('./types').SurfaceType; skillLevel?: number; fee: number; capacity: number | null; description?: string; rules?: string; refundPolicy?: import('./types').RefundPolicyKind }) => Event;
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

  const updateEventRSVP = (eventId: string, status: 'attending' | 'declined' | 'waitlist' | 'none') => {
    setState(s => {
      const events = s.events.map(e => {
        if (e.id === eventId) {
          const wasAttending = e.attendingIds.includes(s.currentUser.id);
          let attendingIds = e.attendingIds.filter(id => id !== s.currentUser.id);
          let declinedIds = e.declinedIds.filter(id => id !== s.currentUser.id);
          let waitlistIds = e.waitlistIds.filter(id => id !== s.currentUser.id);

          const cap = e.capacity;
          if (status === 'attending') {
            if (cap === null || attendingIds.length < cap) attendingIds.push(s.currentUser.id);
            else waitlistIds.push(s.currentUser.id);
          }
          if (status === 'declined') declinedIds.push(s.currentUser.id);
          if (status === 'waitlist') waitlistIds.push(s.currentUser.id);

          // Auto-promote first waitlisted player when an attending slot opens
          if (wasAttending && status !== 'attending' && waitlistIds.length > 0 && (cap === null || attendingIds.length < cap)) {
            const promoted = waitlistIds.shift()!;
            attendingIds.push(promoted);
          }

          return { ...e, attendingIds, declinedIds, waitlistIds };
        }
        return e;
      });
      return { ...s, events };
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
      const matches = s.publicMatches.map(m => {
        const cap = m.maxPlayers;
        const hasRoom = cap == null || m.attendees.length < cap;
        if (m.id === matchId && !m.attendees.includes(s.currentUser.id) && hasRoom) {
          const newAttendees = [...m.attendees, s.currentUser.id];
          return {
            ...m,
            attendees: newAttendees,
            status: cap != null && newAttendees.length >= cap ? 'full' : m.status
          };
        }
        return m;
      });
      return { ...s, publicMatches: matches };
    });
  };

  const leavePublicMatch = (matchId: string) => {
    setState(s => {
      const matches = s.publicMatches.map(m => {
        if (m.id === matchId) {
          const newAttendees = m.attendees.filter(id => id !== s.currentUser.id);
          return {
            ...m,
            attendees: newAttendees,
            status: m.status === 'full' ? 'open' : m.status
          };
        }
        return m;
      });
      return { ...s, publicMatches: matches };
    });
  };

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
      refundPolicy: data.refundPolicy,
      status: 'scheduled',
      attendingIds: [state.currentUser.id],
      declinedIds: [],
      waitlistIds: [],
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
