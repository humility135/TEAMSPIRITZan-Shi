export type Role = 'Owner' | 'Admin' | 'Member';
export type SubscriptionStatus = 'free' | 'pro';
export type EventStatus = 'scheduled' | 'live' | 'finished';
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
    label: '半退',
    short: '分階段退款',
    description: '48 小時前 100% / 24 小時前 50% / 6 小時前 0%。',
  },
  {
    value: 'auto',
    label: '自動（跟天氣）',
    short: '掛 8 號 / 黑雨自動全退',
    description: '系統綁定香港天文台資料，掛 8 號風球或黑雨警告會自動全額退款，其餘情況跟「半退」階梯處理。',
  },
];

export const REFUND_POLICY_LABEL: Record<RefundPolicyKind, string> = {
  half: '半退（48/24/6h 階梯）',
  auto: '自動（跟天氣）',
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
  venueId?: string;
  venueAddress?: string;
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

export interface Event {
  id: string;
  teamId: string;
  title: string;
  datetime: string;
  endDatetime?: string;
  venueId?: string;
  venueAddress?: string;
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
  createdAt: string;
  read: boolean;
}
