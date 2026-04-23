import {
  db,
  usersTable,
  teamsTable,
  teamMembersTable,
  venuesTable,
  eventsTable,
  publicMatchesTable,
  matchCommentsTable,
  hostProfilesTable,
  notificationsTable,
} from "@workspace/db";

async function main() {
  console.log("Seeding…");

  // Wipe (idempotent)
  await db.delete(notificationsTable);
  await db.delete(matchCommentsTable);
  await db.delete(publicMatchesTable);
  await db.delete(eventsTable);
  await db.delete(teamMembersTable);
  await db.delete(teamsTable);
  await db.delete(venuesTable);
  await db.delete(hostProfilesTable);
  await db.delete(usersTable);

  // Users — emails are mock for demo
  await db.insert(usersTable).values([
    { id: "u1", email: "player1@example.com", name: "Ah Fai", avatarUrl: "https://i.pravatar.cc/150?u=u1",
      tokensBalance: 40, subscription: "pro",
      seasonStatsByTeam: {
        t1: { goals: 8, assists: 5, attendance: 88, yellow: 1, red: 0, matches: 12 },
        t2: { goals: 4, assists: 3, attendance: 80, yellow: 1, red: 0, matches: 8 },
      } },
    { id: "u2", email: "player2@example.com", name: "Kit C.", avatarUrl: "https://i.pravatar.cc/150?u=u2",
      tokensBalance: 10, subscription: "free",
      seasonStatsByTeam: { t1: { goals: 2, assists: 15, attendance: 90, yellow: 1, red: 0, matches: 22 } } },
    { id: "u3", email: "player3@example.com", name: "Ming", avatarUrl: "https://i.pravatar.cc/150?u=u3",
      tokensBalance: 0, subscription: "free",
      seasonStatsByTeam: { t1: { goals: 5, assists: 2, attendance: 60, yellow: 4, red: 1, matches: 15 } } },
  ]);

  // Teams
  await db.insert(teamsTable).values([
    { id: "t1", name: "Kowloon City FC", logoUrl: "/src/assets/images/logo-team-1.png",
      accentColor: "#84cc16", district: "九龍城", level: 4, isPro: true, inviteCode: "KCFC23",
      record: { w: 12, d: 3, l: 5, gf: 45, ga: 22 } },
    { id: "t2", name: "Island United", logoUrl: "/src/assets/images/logo-team-2.png",
      accentColor: "#f97316", district: "中西區", level: 3, isPro: false, inviteCode: "ISLU88",
      record: { w: 8, d: 5, l: 8, gf: 30, ga: 35 } },
  ]);
  await db.insert(teamMembersTable).values([
    { teamId: "t1", userId: "u1", role: "Owner" },
    { teamId: "t1", userId: "u2", role: "Admin" },
    { teamId: "t1", userId: "u3", role: "Member" },
    { teamId: "t2", userId: "u1", role: "Member" },
  ]);

  // Venues
  await db.insert(venuesTable).values([
    { id: "v1", name: "摩士公園足球場", district: "黃大仙", address: "黃大仙鳳舞街40號",
      lat: 22.3364, lng: 114.1888, surface: "hard",
      weather: { temp: 28, condition: "Clear", lightningWarning: false } },
    { id: "v2", name: "京士柏遊樂場", district: "油麻地", address: "油麻地京士柏道23號",
      lat: 22.3116, lng: 114.1755, surface: "turf",
      weather: { temp: 29, condition: "Cloudy", lightningWarning: true } },
    { id: "v3", name: "修頓球場", district: "灣仔", address: "灣仔軒尼詩道130號",
      lat: 22.2775, lng: 114.1722, surface: "hard",
      weather: { temp: 30, condition: "Rain", lightningWarning: false } },
  ]);

  // Events
  await db.insert(eventsTable).values([
    { id: "e1", teamId: "t1", title: "聯賽 vs 觀塘流浪",
      datetime: new Date(Date.now() + 86400000 * 2),
      endDatetime: new Date(Date.now() + 86400000 * 2 + 3600000 * 2),
      venueAddress: "黃大仙鳳舞街40號 摩士公園足球場 3號場",
      fee: 50, capacity: 14, status: "scheduled",
      attendingIds: ["u1", "u2"], declinedIds: [], waitlistIds: [], slotOffers: [], playerStats: [] },
    { id: "e2", teamId: "t1", title: "九龍灣友誼賽",
      datetime: new Date(Date.now() + 3600000 * 5),
      endDatetime: new Date(Date.now() + 3600000 * 7),
      venueAddress: "油麻地京士柏道23號 京士柏遊樂場",
      fee: 40, capacity: null, status: "scheduled",
      attendingIds: ["u1"], declinedIds: ["u2"], waitlistIds: [], slotOffers: [], playerStats: [] },
    { id: "e3", teamId: "t2", title: "港島東區快閃",
      datetime: new Date(Date.now() - 86400000 * 3),
      endDatetime: new Date(Date.now() - 86400000 * 3 + 3600000 * 2),
      venueAddress: "灣仔軒尼詩道130號 修頓球場",
      fee: 0, capacity: 14, status: "finished",
      attendingIds: ["u1"], declinedIds: [], waitlistIds: [], slotOffers: [],
      finalScore: { home: 3, away: 1 },
      playerStats: [{ userId: "u1", goals: 2, assists: 0, yellow: 0, red: 0 }] },
  ]);

  // Public matches
  await db.insert(publicMatchesTable).values([
    { id: "pm1", hostId: "u1",
      venueAddress: "黃大仙鳳舞街40號 摩士公園足球場 3號場",
      datetime: new Date(Date.now() + 86400000 * 1.5),
      endDatetime: new Date(Date.now() + 86400000 * 1.5 + 3600000 * 2),
      fee: 60, surface: "hard", skillLevel: 3, maxPlayers: 14,
      attendees: ["u1","u2","u3","guest1","guest2","guest3","guest4","guest5","guest6","guest7","guest8"],
      description: "休閒踢，不計較輸贏，志在流汗。",
      rules: "自備一淺一深波衫，不准粗口，友誼第一。",
      refundPolicy: "half", status: "open", isVerified: true,
      waitlistIds: [], slotOffers: [] },
    { id: "pm2", hostId: "u2",
      venueAddress: "油麻地京士柏道23號 京士柏遊樂場",
      datetime: new Date(Date.now() + 3600000 * 3),
      endDatetime: new Date(Date.now() + 3600000 * 5),
      fee: 80, surface: "turf", skillLevel: 4, maxPlayers: 10,
      attendees: ["u2","guest1","guest2","guest3","guest4","guest5","guest6","guest7","guest8","guest9"],
      description: "認真踢，有球證。",
      rules: "守門員免費，早15分鐘到場熱身。",
      refundPolicy: "half", status: "full",
      waitlistIds: ["u3","guest10"], slotOffers: [] },
    { id: "pm3", hostId: "u3",
      venueAddress: "灣仔軒尼詩道130號 修頓球場",
      datetime: new Date(Date.now() + 86400000 * 5),
      endDatetime: new Date(Date.now() + 86400000 * 5 + 3600000 * 2),
      fee: 50, surface: "hard", skillLevel: 2, maxPlayers: null,
      attendees: ["u3"],
      description: "新手場，歡迎任何人。",
      rules: "開心足球。",
      refundPolicy: "auto", status: "open",
      waitlistIds: [], slotOffers: [] },
  ]);

  // Match comments
  await db.insert(matchCommentsTable).values([
    { id: "c1", matchId: "pm1", userId: "u2", text: "請問仲有冇守門員位?" },
    { id: "c2", matchId: "pm1", userId: "u1", text: "有，你可以直接報名！" },
  ]);

  // Host profiles
  await db.insert(hostProfilesTable).values([
    { userId: "u1", hostedCount: 12, punctualityRate: 98, averageRating: 4.8,
      reviews: [
        { reviewerId: "u2", rating: 5, comment: "好場，準時開波！", date: "2023-10-01" },
        { reviewerId: "u3", rating: 4, comment: "搞手幾好人。", date: "2023-09-15" },
      ] },
    { userId: "u2", hostedCount: 3, punctualityRate: 100, averageRating: 5.0,
      reviews: [{ reviewerId: "u1", rating: 5, comment: "Nice", date: "2023-10-05" }] },
  ]);

  // Notifications for u1
  await db.insert(notificationsTable).values([
    { id: "n1", userId: "u1", type: "event", message: "你有一個今晚的比賽即將開始：九龍灣友誼賽", read: false },
    { id: "n2", userId: "u1", type: "team", message: "Kowloon City FC 已將你設為管理員", read: true },
  ]);

  console.log("Seed done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
