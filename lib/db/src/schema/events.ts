import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export type SlotOffer = {
  id: string;
  mode: "fifo" | "race";
  eligibleUserIds: string[];
  acceptedBy?: string;
  paymentDeadline?: string;
  createdAt: string;
};

export type PlayerStat = {
  userId: string; goals: number; assists: number; yellow: number; red: number;
};

export type FinalScore = { home: number; away: number };

export const eventsTable = sqliteTable("events", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull(),
  title: text("title").notNull(),
  datetime: integer("datetime", { mode: "timestamp" }).notNull(),
  endDatetime: integer("end_datetime", { mode: "timestamp" }),
  venueAddress: text("venue_address"),
  surface: text("surface"),
  skillLevel: integer("skill_level"),
  fee: integer("fee").notNull().default(0),
  capacity: integer("capacity"),
  description: text("description"),
  rules: text("rules"),
  status: text("status").notNull().default("scheduled"),
  attendingIds: text("attending_ids", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  declinedIds: text("declined_ids", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  waitlistIds: text("waitlist_ids", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  slotOffers: text("slot_offers", { mode: "json" }).$type<SlotOffer[]>().notNull().default(sql`'[]'`),
  finalScore: text("final_score", { mode: "json" }).$type<FinalScore | null>(),
  playerStats: text("player_stats", { mode: "json" }).$type<PlayerStat[]>().notNull().default(sql`'[]'`),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type EventRow = typeof eventsTable.$inferSelect;
