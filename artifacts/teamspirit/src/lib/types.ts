export type Role = 'Owner' | 'Admin' | 'Member';
export type SubscriptionStatus = 'free' | 'pro';
export type EventStatus = 'scheduled' | 'live' | 'finished';
export type RSVPStatus = 'attending' | 'declined' | 'waitlist' | 'none';
export type SurfaceType = 'hard' | 'turf' | 'grass';

export interface SeasonStats {
  goals: number;
  assists: number;
  attendance: number;
  yellow: number;
  red: number;
  matches: number;
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  role: Record<string, Role>; // teamId -> Role
  tokensBalance: number;
  subscription: SubscriptionStatus;
  seasonStats: SeasonStats;
}

export interface TeamRecord {
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
}

export interface Team {
  id: string;
  name: string;
  logoUrl: string;
  accentColor: string;
  memberIds: string[];
  record: TeamRecord;
  isPro: boolean;
  district?: string;
  level?: number;
  inviteCode?: string;
}

export interface Weather {
  temp: number;
  condition: string;
  lightningWarning: boolean;
}

export interface Venue {
  id: string;
  name: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  surface: SurfaceType;
  weather: Weather;
}

export interface PlayerStat {
  userId: string;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
}

export interface PublicMatch {
  id: string;
  hostId: string;
  venueId: string;
  datetime: string;
  fee: number;
  surface: SurfaceType;
  skillLevel: number;
  maxPlayers: number;
  attendees: string[];
  description: string;
  rules: string;
  refundPolicy: string;
  status: 'open' | 'full' | 'cancelled' | 'finished';
  createdAt: string;
  isVerified?: boolean;
}

export interface HostReview {
  reviewerId: string;
  rating: number;
  comment: string;
  date: string;
}

export interface HostProfile {
  userId: string;
  hostedCount: number;
  punctualityRate: number;
  averageRating: number;
  reviews: HostReview[];
}

export interface MatchComment {
  id: string;
  matchId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Event {
  id: string;
  teamId: string;
  title: string;
  datetime: string;
  venueId: string;
  fee: number;
  capacity: number;
  status: EventStatus;
  attendingIds: string[];
  declinedIds: string[];
  waitlistIds: string[];
  finalScore?: {
    home: number;
    away: number;
  };
  playerStats: PlayerStat[];
}

export interface Notification {
  id: string;
  type: 'event' | 'system' | 'team';
  message: string;
  createdAt: string;
  read: boolean;
}
