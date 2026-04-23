import { User, Team, Venue, Event, Notification, PublicMatch, HostProfile, MatchComment } from './types';

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Ah Fai',
    avatarUrl: 'https://i.pravatar.cc/150?u=u1',
    role: { 't1': 'Owner', 't2': 'Member' },
    tokensBalance: 40,
    subscription: 'pro',
    seasonStatsByTeam: {
      t1: { goals: 8, assists: 5, attendance: 88, yellow: 1, red: 0, matches: 12 },
      t2: { goals: 4, assists: 3, attendance: 80, yellow: 1, red: 0, matches: 8 }
    }
  },
  {
    id: 'u2',
    name: 'Kit C.',
    avatarUrl: 'https://i.pravatar.cc/150?u=u2',
    role: { 't1': 'Admin' },
    tokensBalance: 10,
    subscription: 'free',
    seasonStatsByTeam: {
      t1: { goals: 2, assists: 15, attendance: 90, yellow: 1, red: 0, matches: 22 }
    }
  },
  {
    id: 'u3',
    name: 'Ming',
    avatarUrl: 'https://i.pravatar.cc/150?u=u3',
    role: { 't1': 'Member' },
    tokensBalance: 0,
    subscription: 'free',
    seasonStatsByTeam: {
      t1: { goals: 5, assists: 2, attendance: 60, yellow: 4, red: 1, matches: 15 }
    }
  }
];

export const mockHostProfiles: HostProfile[] = [
  {
    userId: 'u1',
    hostedCount: 12,
    punctualityRate: 98,
    averageRating: 4.8,
    reviews: [
      { reviewerId: 'u2', rating: 5, comment: '好場，準時開波！', date: '2023-10-01' },
      { reviewerId: 'u3', rating: 4, comment: '搞手幾好人。', date: '2023-09-15' }
    ]
  },
  {
    userId: 'u2',
    hostedCount: 3,
    punctualityRate: 100,
    averageRating: 5.0,
    reviews: [
      { reviewerId: 'u1', rating: 5, comment: 'Nice', date: '2023-10-05' }
    ]
  }
];

export const mockPublicMatches: PublicMatch[] = [
  {
    id: 'pm1',
    hostId: 'u1',
    venueAddress: '黃大仙鳳舞街40號 摩士公園足球場 3號場',
    datetime: new Date(Date.now() + 86400000 * 1.5).toISOString(),
    endDatetime: new Date(Date.now() + 86400000 * 1.5 + 3600000 * 2).toISOString(),
    fee: 60,
    surface: 'hard',
    skillLevel: 3,
    maxPlayers: 14,
    attendees: ['u1', 'u2', 'u3', 'guest1', 'guest2', 'guest3', 'guest4', 'guest5', 'guest6', 'guest7', 'guest8'],
    description: '休閒踢，不計較輸贏，志在流汗。',
    rules: '自備一淺一深波衫，不准粗口，友誼第一。',
    refundPolicy: 'full',
    status: 'open',
    createdAt: new Date().toISOString(),
    isVerified: true
  },
  {
    id: 'pm2',
    hostId: 'u2',
    venueAddress: '油麻地京士柏道23號 京士柏遊樂場',
    datetime: new Date(Date.now() + 3600000 * 3).toISOString(),
    endDatetime: new Date(Date.now() + 3600000 * 5).toISOString(),
    fee: 80,
    surface: 'turf',
    skillLevel: 4,
    maxPlayers: 10,
    attendees: ['u2', 'guest1', 'guest2', 'guest3', 'guest4', 'guest5', 'guest6', 'guest7', 'guest8'],
    description: '認真踢，有球證。',
    rules: '守門員免費，早15分鐘到場熱身。',
    refundPolicy: 'half',
    status: 'open',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'pm3',
    hostId: 'u3',
    venueAddress: '灣仔軒尼詩道130號 修頓球場',
    datetime: new Date(Date.now() + 86400000 * 5).toISOString(),
    endDatetime: new Date(Date.now() + 86400000 * 5 + 3600000 * 2).toISOString(),
    fee: 50,
    surface: 'hard',
    skillLevel: 2,
    maxPlayers: null,
    attendees: ['u3'],
    description: '新手場，歡迎任何人。',
    rules: '開心足球。',
    refundPolicy: 'auto',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

export const mockMatchComments: MatchComment[] = [
  { id: 'c1', matchId: 'pm1', userId: 'u2', text: '請問仲有冇守門員位?', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 'c2', matchId: 'pm1', userId: 'u1', text: '有，你可以直接報名！', createdAt: new Date(Date.now() - 3600000).toISOString() }
];

export const mockTeams: Team[] = [
  {
    id: 't1',
    name: 'Kowloon City FC',
    logoUrl: '/src/assets/images/logo-team-1.png',
    accentColor: '#84cc16',
    memberIds: ['u1', 'u2', 'u3'],
    record: { w: 12, d: 3, l: 5, gf: 45, ga: 22 },
    isPro: true,
    district: '九龍城',
    level: 4,
    inviteCode: 'KCFC23'
  },
  {
    id: 't2',
    name: 'Island United',
    logoUrl: '/src/assets/images/logo-team-2.png',
    accentColor: '#f97316',
    memberIds: ['u1'],
    record: { w: 8, d: 5, l: 8, gf: 30, ga: 35 },
    isPro: false,
    district: '中西區',
    level: 3,
    inviteCode: 'ISLU88'
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
    datetime: new Date(Date.now() + 86400000 * 2).toISOString(),
    endDatetime: new Date(Date.now() + 86400000 * 2 + 3600000 * 2).toISOString(),
    venueAddress: '黃大仙鳳舞街40號 摩士公園足球場 3號場',
    fee: 50,
    capacity: 14,
    status: 'scheduled',
    attendingIds: ['u1', 'u2'],
    declinedIds: [],
    waitlistIds: [],
    playerStats: []
  },
  {
    id: 'e2',
    teamId: 't1',
    title: '九龍灣友誼賽',
    datetime: new Date(Date.now() + 3600000 * 5).toISOString(),
    endDatetime: new Date(Date.now() + 3600000 * 7).toISOString(),
    venueAddress: '油麻地京士柏道23號 京士柏遊樂場',
    fee: 40,
    capacity: null,
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
    datetime: new Date(Date.now() - 86400000 * 3).toISOString(),
    endDatetime: new Date(Date.now() - 86400000 * 3 + 3600000 * 2).toISOString(),
    venueAddress: '灣仔軒尼詩道130號 修頓球場',
    fee: 0,
    capacity: 14,
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