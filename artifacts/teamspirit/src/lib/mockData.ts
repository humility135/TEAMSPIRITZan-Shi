import { User, Team, Venue, Event, Notification } from './types';

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Ah Fai',
    avatarUrl: 'https://i.pravatar.cc/150?u=u1',
    role: { 't1': 'Owner', 't2': 'Member' },
    tokensBalance: 40,
    subscription: 'pro',
    seasonStats: { goals: 12, assists: 8, attendance: 85, yellow: 2, red: 0, matches: 20 }
  },
  {
    id: 'u2',
    name: 'Kit C.',
    avatarUrl: 'https://i.pravatar.cc/150?u=u2',
    role: { 't1': 'Admin' },
    tokensBalance: 10,
    subscription: 'free',
    seasonStats: { goals: 2, assists: 15, attendance: 90, yellow: 1, red: 0, matches: 22 }
  },
  {
    id: 'u3',
    name: 'Ming',
    avatarUrl: 'https://i.pravatar.cc/150?u=u3',
    role: { 't1': 'Member' },
    tokensBalance: 0,
    subscription: 'free',
    seasonStats: { goals: 5, assists: 2, attendance: 60, yellow: 4, red: 1, matches: 15 }
  }
];

export const mockTeams: Team[] = [
  {
    id: 't1',
    name: 'Kowloon City FC',
    logoUrl: '/src/assets/images/logo-team-1.png',
    accentColor: '#84cc16', // neon green
    memberIds: ['u1', 'u2', 'u3'],
    record: { w: 12, d: 3, l: 5, gf: 45, ga: 22 },
    isPro: true
  },
  {
    id: 't2',
    name: 'Island United',
    logoUrl: '/src/assets/images/logo-team-2.png',
    accentColor: '#f97316', // neon orange
    memberIds: ['u1'],
    record: { w: 8, d: 5, l: 8, gf: 30, ga: 35 },
    isPro: false
  }
];

export const mockVenues: Venue[] = [
  {
    id: 'v1',
    name: '摩士公園足球場',
    district: '黃大仙',
    address: '黃大仙鳳舞街40號',
    lat: 22.3364,
    lng: 114.1888,
    surface: 'hard',
    weather: { temp: 28, condition: 'Clear', lightningWarning: false }
  },
  {
    id: 'v2',
    name: '京士柏遊樂場',
    district: '油麻地',
    address: '油麻地京士柏道23號',
    lat: 22.3116,
    lng: 114.1755,
    surface: 'turf',
    weather: { temp: 29, condition: 'Cloudy', lightningWarning: true }
  },
  {
    id: 'v3',
    name: '修頓球場',
    district: '灣仔',
    address: '灣仔軒尼詩道130號',
    lat: 22.2775,
    lng: 114.1722,
    surface: 'hard',
    weather: { temp: 30, condition: 'Rain', lightningWarning: false }
  }
];

export const mockEvents: Event[] = [
  {
    id: 'e1',
    teamId: 't1',
    title: '聯賽 vs 觀塘流浪',
    datetime: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days later
    venueId: 'v1',
    fee: 50,
    status: 'scheduled',
    attendingIds: ['u1', 'u2'],
    declinedIds: [],
    waitlistIds: ['u3'],
    playerStats: []
  },
  {
    id: 'e2',
    teamId: 't1',
    title: '九龍灣友誼賽',
    datetime: new Date(Date.now() + 3600000 * 5).toISOString(), // 5 hours later (today)
    venueId: 'v2',
    fee: 40,
    status: 'scheduled',
    attendingIds: ['u1'],
    declinedIds: ['u2'],
    waitlistIds: [],
    playerStats: []
  },
  {
    id: 'e3',
    teamId: 't2',
    title: '港島東區快閃',
    datetime: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    venueId: 'v3',
    fee: 60,
    status: 'finished',
    attendingIds: ['u1'],
    declinedIds: [],
    waitlistIds: [],
    finalScore: { home: 3, away: 1 },
    playerStats: [
      { userId: 'u1', goals: 2, assists: 0, yellow: 0, red: 0 }
    ]
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'event',
    message: '你有一個今晚的比賽即將開始：九龍灣友誼賽',
    createdAt: new Date().toISOString(),
    read: false
  },
  {
    id: 'n2',
    type: 'team',
    message: 'Kowloon City FC 已將你設為管理員',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    read: true
  }
];