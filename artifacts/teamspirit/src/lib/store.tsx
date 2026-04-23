import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Team, Event, Venue, Notification } from './types';
import { mockUsers, mockTeams, mockEvents, mockVenues, mockNotifications } from './mockData';

interface AppState {
  currentUser: User;
  teams: Team[];
  events: Event[];
  venues: Venue[];
  notifications: Notification[];
  isProMode: boolean;
}

interface AppContextType extends AppState {
  toggleProMode: () => void;
  updateEventRSVP: (eventId: string, status: 'attending' | 'declined' | 'waitlist' | 'none') => void;
  updateMatchStats: (eventId: string, userId: string, field: 'goals' | 'assists' | 'yellow' | 'red', delta: number) => void;
  markNotificationRead: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('teamspirit_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse state', e);
      }
    }
    return {
      currentUser: mockUsers[0],
      teams: mockTeams,
      events: mockEvents,
      venues: mockVenues,
      notifications: mockNotifications,
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
          const attendingIds = e.attendingIds.filter(id => id !== s.currentUser.id);
          const declinedIds = e.declinedIds.filter(id => id !== s.currentUser.id);
          const waitlistIds = e.waitlistIds.filter(id => id !== s.currentUser.id);

          if (status === 'attending') attendingIds.push(s.currentUser.id);
          if (status === 'declined') declinedIds.push(s.currentUser.id);
          if (status === 'waitlist') waitlistIds.push(s.currentUser.id);

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

  return (
    <AppContext.Provider value={{
      ...state,
      toggleProMode,
      updateEventRSVP,
      updateMatchStats,
      markNotificationRead
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
