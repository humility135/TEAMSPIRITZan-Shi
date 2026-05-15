export type Role = 'Owner' | 'Admin' | 'Member';
export type SubscriptionStatus = 'free' | 'pro';
export type EventStatus = 'scheduled' | 'live' | 'finished' | 'cancelled';
export type RSVPStatus = 'attending' | 'declined' | 'waitlist' | 'none';
export type SurfaceType = 'hard' | 'turf' | 'grass';
export type RefundPolicyKind = 'half' | 'auto';

export interface RefundPolicyOption {
  value: RefundPolicyKind;
  label: string;
  short: string;
  description: string;
}

export const REFUND_POLICY_OPTIONS: RefundPolicyOption[] = [
  {
    value: 'half',
    label: 'refundHalfLabel',
    short: 'refundHalfShort',
    description: 'refundHalfDesc',
  },
  {
    value: 'auto',
    label: 'refundAutoLabel',
    short: 'refundAutoShort',
    description: 'refundAutoDesc',
  },
];

export const REFUND_POLICY_LABEL: Record<RefundPolicyKind, string> = {
  half: 'refundHalfLabel',
  auto: 'refundAutoLabel',
};

export const RACE_THRESHOLD_HOURS = 24;
export const PAYMENT_WINDOW_MINUTES = 60;

export type SlotOfferMode = 'fifo' | 'race';

export interface SlotOffer {
  id: string;
  mode: SlotOfferMode;
  eligibleUserIds: string[];
  acceptedBy?: string;
  paymentDeadline?: string;
  createdAt: string;
}

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
  seasonStatsByTeam: Record<string, SeasonStats>;
}

export const EMPTY_SEASON_STATS: SeasonStats = { goals: 0, assists: 0, attendance: 0, yellow: 0, red: 0, matches: 0 };

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
  nameEn?: string;
  district: string;
  districtEn?: string;
  address: string;
  addressEn?: string;
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
  venueId?: string;
  venueAddress?: string;
  venueAddressEn?: string;
  district?: string;
  datetime: string;
  endDatetime?: string;
  fee: number;
  surface: SurfaceType;
  skillLevel: number;
  maxPlayers: number | null;
  attendees: string[];
  description: string;
  rules: string;
  refundPolicy: RefundPolicyKind;
  status: 'open' | 'full' | 'cancelled' | 'finished';
  createdAt: string;
  isVerified?: boolean;
  waitlistIds: string[];
  slotOffers: SlotOffer[];
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

export interface EventComment {
  id: string;
  eventId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface TeamMessage {
  id: string;
  teamId: string;
  userId: string;
  kind: 'text' | 'image';
  text: string;
  imageUrl?: string | null;
  createdAt: string;
}

export interface Event {
  id: string;
  teamId: string;
  title: string;
  datetime: string;
  endDatetime?: string;
  venueId?: string;
  venueAddress?: string;
  venueAddressEn?: string;
  district?: string;
  surface?: SurfaceType;
  skillLevel?: number;
  fee: number;
  capacity: number | null;
  description?: string;
  rules?: string;
  status: EventStatus;
  attendingIds: string[];
  declinedIds: string[];
  waitlistIds: string[];
  slotOffers: SlotOffer[];
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
  messageEn?: string;
  href?: string;
  createdAt: string;
  read: boolean;
}
