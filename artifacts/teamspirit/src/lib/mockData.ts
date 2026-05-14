import { User, Team, Venue, Event, Notification, PublicMatch, HostProfile, MatchComment } from './types';

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: '阿輝',
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
    name: '阿傑',
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
    name: '小明',
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
    venueId: 'v1',
    venueAddress: '黃大仙鳳舞街40號 摩士公園足球場 3號場',
    venueAddressEn: 'Morse Park Football Pitch No. 3, 40 Fung Mo Street, Wong Tai Sin',
    datetime: new Date(Date.now() + 86400000 * 1.5).toISOString(),
    endDatetime: new Date(Date.now() + 86400000 * 1.5 + 3600000 * 2).toISOString(),
    fee: 60,
    surface: 'hard',
    skillLevel: 3,
    maxPlayers: 14,
    attendees: ['u1', 'u2', 'u3', 'guest1', 'guest2', 'guest3', 'guest4', 'guest5', 'guest6', 'guest7', 'guest8'],
    description: '休閒踢，不計較輸贏，志在流汗。(Casual play, focus on fun, not winning.)',
    rules: '自備一淺一深波衫，不准粗口，友誼第一。(Bring dark/light shirts, no swearing, friendship first.)',
    refundPolicy: 'half',
    status: 'open',
    createdAt: new Date().toISOString(),
    isVerified: true,
    waitlistIds: [],
    slotOffers: []
  },
  {
    id: 'pm2',
    hostId: 'u2',
    venueId: 'v2',
    venueAddress: '油麻地京士柏道23號 京士柏遊樂場',
    venueAddressEn: 'King\'s Park Recreation Ground, 23 King\'s Park Rise, Yau Ma Tei',
    datetime: new Date(Date.now() + 3600000 * 3).toISOString(),
    endDatetime: new Date(Date.now() + 3600000 * 5).toISOString(),
    fee: 80,
    surface: 'turf',
    skillLevel: 4,
    maxPlayers: 10,
    attendees: ['u2', 'guest1', 'guest2', 'guest3', 'guest4', 'guest5', 'guest6', 'guest7', 'guest8', 'guest9'],
    description: '認真踢，有球證。',
    rules: '守門員免費，早15分鐘到場熱身。',
    refundPolicy: 'half',
    status: 'full',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    waitlistIds: ['u3', 'guest10'],
    slotOffers: []
  },
  {
    id: 'pm3',
    hostId: 'u3',
    venueId: 'v3',
    venueAddress: '灣仔軒尼詩道130號 修頓球場',
    venueAddressEn: 'Southorn Playground, 130 Hennessy Road, Wan Chai',
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
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    waitlistIds: [],
    slotOffers: []
  }
];

export const mockMatchComments: MatchComment[] = [
  { id: 'c1', matchId: 'pm1', userId: 'u2', text: '請問仲有冇守門員位?', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 'c2', matchId: 'pm1', userId: 'u1', text: '有，你可以直接報名！', createdAt: new Date(Date.now() - 3600000).toISOString() }
];

export const mockTeams: Team[] = [
  {
    id: 't1',
    name: '九龍城足球隊',
    logoUrl: '/src/assets/images/logo-team-1.png',
    accentColor: '#84cc16',
    memberIds: ['u1', 'u2', 'u3'],
    record: { w: 12, d: 3, l: 5, gf: 45, ga: 22 },
    isPro: true,
    district: '九龍城區',
    level: 4,
    inviteCode: 'KCFC23'
  },
  {
    id: 't2',
    name: '港島聯隊',
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
  // === Kowloon ===
  {
    id: 'v1',
    name: '摩士公園足球場',
    nameEn: 'Morse Park Football Pitch',
    district: '黃大仙區',
    districtEn: 'Wong Tai Sin',
    address: '黃大仙鳳舞街40號',
    addressEn: '40 Fung Mo Street, Wong Tai Sin',
    lat: 22.3364,
    lng: 114.1888,
    surface: 'hard',
    weather: { temp: 28, condition: 'Clear', lightningWarning: false }
  },
  {
    id: 'v2',
    name: '京士柏遊樂場',
    nameEn: 'King\'s Park Recreation Ground',
    district: '油尖旺區',
    districtEn: 'Yau Tsim Mong',
    address: '油麻地京士柏道23號',
    addressEn: '23 King\'s Park Rise, Yau Ma Tei',
    lat: 22.3116,
    lng: 114.1755,
    surface: 'turf',
    weather: { temp: 29, condition: 'Cloudy', lightningWarning: true }
  },
  {
    id: 'v3',
    name: '修頓球場',
    nameEn: 'Southorn Playground',
    district: '灣仔區',
    districtEn: 'Wan Chai',
    address: '灣仔軒尼詩道130號',
    addressEn: '130 Hennessy Road, Wan Chai',
    lat: 22.2775,
    lng: 114.1722,
    surface: 'hard',
    weather: { temp: 30, condition: 'Rain', lightningWarning: false }
  },
  {
    id: 'v4',
    name: '九龍灣公園足球場',
    nameEn: 'Kowloon Bay Park Football Pitch',
    district: '觀塘區',
    districtEn: 'Kwun Tong',
    address: '九龍灣啟樂街1號',
    addressEn: '1 Kai Lok Street, Kowloon Bay',
    lat: 22.3247,
    lng: 114.2131,
    surface: 'hard',
    weather: { temp: 28, condition: 'Clear', lightningWarning: false }
  },
  {
    id: 'v5',
    name: '深水埗運動場',
    nameEn: 'Sham Shui Po Sports Ground',
    district: '深水埗區',
    districtEn: 'Sham Shui Po',
    address: '深水埗興華街5號',
    addressEn: '5 Hing Wah Street, Sham Shui Po',
    lat: 22.3337,
    lng: 114.1581,
    surface: 'turf',
    weather: { temp: 29, condition: 'Cloudy', lightningWarning: false }
  },
  {
    id: 'v6',
    name: '斧山道運動場',
    nameEn: 'Hammer Hill Road Sports Ground',
    district: '黃大仙區',
    districtEn: 'Wong Tai Sin',
    address: '鑽石山斧山道158號',
    addressEn: '158 Hammer Hill Road, Diamond Hill',
    lat: 22.3421,
    lng: 114.2049,
    surface: 'turf',
    weather: { temp: 27, condition: 'Clear', lightningWarning: false }
  },
  {
    id: 'v7',
    name: '界限街人造草足球場',
    nameEn: 'Boundary Street Artificial Turf Pitch',
    district: '九龍城區',
    districtEn: 'Kowloon City',
    address: '九龍城界限街63號',
    addressEn: '63 Boundary Street, Kowloon City',
    lat: 22.3265,
    lng: 114.1874,
    surface: 'turf',
    weather: { temp: 30, condition: 'Sunny', lightningWarning: false }
  },

  // === Hong Kong Island ===
  {
    id: 'v8',
    name: '香港仔運動場',
    nameEn: 'Aberdeen Sports Ground',
    district: '南區',
    districtEn: 'Southern',
    address: '香港仔黃竹坑道108號',
    addressEn: '108 Wong Chuk Hang Road, Aberdeen',
    lat: 22.2487,
    lng: 114.1719,
    surface: 'turf',
    weather: { temp: 28, condition: 'Cloudy', lightningWarning: false }
  },
  {
    id: 'v9',
    name: '銅鑼灣運動場',
    nameEn: 'Causeway Bay Sports Ground',
    district: '灣仔區',
    districtEn: 'Wan Chai',
    address: '銅鑼灣高士威道',
    addressEn: 'Causeway Road, Causeway Bay',
    lat: 22.2819,
    lng: 114.1908,
    surface: 'hard',
    weather: { temp: 31, condition: 'Sunny', lightningWarning: false }
  },
  {
    id: 'v10',
    name: '小西灣運動場',
    nameEn: 'Siu Sai Wan Sports Ground',
    district: '東區',
    districtEn: 'Eastern',
    address: '小西灣富康街8號',
    addressEn: '8 Fu Hong Street, Siu Sai Wan',
    lat: 22.2642,
    lng: 114.2502,
    surface: 'turf',
    weather: { temp: 27, condition: 'Clear', lightningWarning: false }
  },

  // === New Territories ===
  {
    id: 'v11',
    name: '沙田運動場',
    nameEn: 'Sha Tin Sports Ground',
    district: '沙田區',
    districtEn: 'Sha Tin',
    address: '沙田源禾路18號',
    addressEn: '18 Yuen Wo Road, Sha Tin',
    lat: 22.3833,
    lng: 114.1919,
    surface: 'turf',
    weather: { temp: 29, condition: 'Cloudy', lightningWarning: false }
  },
  {
    id: 'v12',
    name: '大埔運動場',
    nameEn: 'Tai Po Sports Ground',
    district: '大埔區',
    districtEn: 'Tai Po',
    address: '大埔頭路21號',
    addressEn: '21 Tai Po Tau Road, Tai Po',
    lat: 22.4519,
    lng: 114.1654,
    surface: 'turf',
    weather: { temp: 28, condition: 'Clear', lightningWarning: false }
  },
  {
    id: 'v13',
    name: '屯門鄧肇堅運動場',
    nameEn: 'Tuen Mun Tang Shiu Kin Sports Ground',
    district: '屯門區',
    districtEn: 'Tuen Mun',
    address: '屯門青松觀路17號',
    addressEn: '17 Tsing Chung Koon Road, Tuen Mun',
    lat: 22.4014,
    lng: 113.9754,
    surface: 'turf',
    weather: { temp: 30, condition: 'Sunny', lightningWarning: false }
  },
  {
    id: 'v14',
    name: '元朗大球場',
    nameEn: 'Yuen Long Stadium',
    district: '元朗區',
    districtEn: 'Yuen Long',
    address: '元朗體育路6號',
    addressEn: '6 Yuen Long Tai Yuk Road, Yuen Long',
    lat: 22.4454,
    lng: 114.0241,
    surface: 'turf',
    weather: { temp: 29, condition: 'Cloudy', lightningWarning: false }
  },
  {
    id: 'v15',
    name: '青衣運動場',
    nameEn: 'Tsing Yi Sports Ground',
    district: '葵青區',
    districtEn: 'Kwai Tsing',
    address: '青衣青敬路51號',
    addressEn: '51 Tsing King Road, Tsing Yi',
    lat: 22.3556,
    lng: 114.1077,
    surface: 'turf',
    weather: { temp: 28, condition: 'Clear', lightningWarning: false }
  },
  {
    id: 'v16',
    name: '將軍澳運動場',
    nameEn: 'Tseung Kwan O Sports Ground',
    district: '西貢區',
    districtEn: 'Sai Kung',
    address: '將軍澳寶康路109號',
    addressEn: '109 Po Hong Road, Tseung Kwan O',
    lat: 22.3138,
    lng: 114.2647,
    surface: 'turf',
    weather: { temp: 27, condition: 'Clear', lightningWarning: false }
  },
  {
    id: 'v17',
    name: '北區運動場',
    nameEn: 'North District Sports Ground',
    district: '北區',
    districtEn: 'North',
    address: '上水天平路26號',
    addressEn: '26 Tin Ping Road, Sheung Shui',
    lat: 22.5046,
    lng: 114.1306,
    surface: 'turf',
    weather: { temp: 28, condition: 'Cloudy', lightningWarning: false }
  },
  {
    id: 'v18',
    name: '荃灣城門谷運動場',
    nameEn: 'Tsuen Wan Shing Mun Valley Sports Ground',
    district: '荃灣區',
    districtEn: 'Tsuen Wan',
    address: '荃灣城門道21號',
    addressEn: '21 Shing Mun Road, Tsuen Wan',
    lat: 22.3766,
    lng: 114.1259,
    surface: 'turf',
    weather: { temp: 29, condition: 'Clear', lightningWarning: false }
  },
  {
    id: 'v19',
    name: '馬鞍山運動場',
    nameEn: 'Ma On Shan Sports Ground',
    district: '沙田區',
    districtEn: 'Sha Tin',
    address: '馬鞍山恆康街1號',
    addressEn: '1 Hang Hong Street, Ma On Shan',
    lat: 22.4227,
    lng: 114.2304,
    surface: 'turf',
    weather: { temp: 28, condition: 'Clear', lightningWarning: false }
  },
  {
    id: 'v20',
    name: '長洲運動場',
    nameEn: 'Cheung Chau Sports Ground',
    district: '離島區',
    districtEn: 'Islands',
    address: '長洲花地路',
    addressEn: 'Fa Tei Road, Cheung Chau',
    lat: 22.2053,
    lng: 114.0306,
    surface: 'grass',
    weather: { temp: 27, condition: 'Clear', lightningWarning: false }
  },
];

export const mockEvents: Event[] = [
  {
    id: 'e1',
    teamId: 't1',
    title: '聯賽 vs 觀塘流浪',
    datetime: new Date(Date.now() + 86400000 * 2).toISOString(),
    endDatetime: new Date(Date.now() + 86400000 * 2 + 3600000 * 2).toISOString(),
    venueId: 'v1',
    venueAddress: '黃大仙鳳舞街40號 摩士公園足球場 3號場',
    venueAddressEn: 'Morse Park Football Pitch No. 3, 40 Fung Mo Street, Wong Tai Sin',
    fee: 50,
    capacity: 14,
    status: 'scheduled',
    attendingIds: ['u1', 'u2'],
    declinedIds: [],
    waitlistIds: [],
    slotOffers: [],
    playerStats: []
  },
  {
    id: 'e2',
    teamId: 't1',
    title: '九龍灣友誼賽',
    datetime: new Date(Date.now() + 3600000 * 5).toISOString(),
    endDatetime: new Date(Date.now() + 3600000 * 7).toISOString(),
    venueId: 'v2',
    venueAddress: '油麻地京士柏道23號 京士柏遊樂場',
    venueAddressEn: "King's Park Recreation Ground, 23 King's Park Rise, Yau Ma Tei",
    fee: 40,
    capacity: null,
    status: 'scheduled',
    attendingIds: ['u1'],
    declinedIds: ['u2'],
    waitlistIds: [],
    slotOffers: [],
    playerStats: []
  },
  {
    id: 'e3',
    teamId: 't2',
    title: '港島東區快閃',
    datetime: new Date(Date.now() - 86400000 * 3).toISOString(),
    endDatetime: new Date(Date.now() - 86400000 * 3 + 3600000 * 2).toISOString(),
    venueId: 'v3',
    venueAddress: '灣仔軒尼詩道130號 修頓球場',
    venueAddressEn: 'Southorn Playground, 130 Hennessy Road, Wan Chai',
    fee: 0,
    capacity: 14,
    status: 'finished',
    attendingIds: ['u1'],
    declinedIds: [],
    waitlistIds: [],
    slotOffers: [],
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