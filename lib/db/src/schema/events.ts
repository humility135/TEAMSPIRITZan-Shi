import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

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

export const eventsTable = pgTable("events", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull(),
  title: text("title").notNull(),
  datetime: timestamp("datetime", { withTimezone: true }).notNull(),
  endDatetime: timestamp("end_datetime", { withTimezone: true }),
  venueAddress: text("venue_address"),
  surface: text("surface"),
  skillLevel: integer("skill_level"),
  fee: integer("fee").notNull().default(0),
  capacity: integer("capacity"),
  description: text("description"),
  rules: text("rules"),
  status: text("status").notNull().default("scheduled"),
  attendingIds: text("attending_ids").array().notNull().default([]),
  declinedIds: text("declined_ids").array().notNull().default([]),
  waitlistIds: text("waitlist_ids").array().notNull().default([]),
  slotOffers: jsonb("slot_offers").$type<SlotOffer[]>().notNull().default([]),
  finalScore: jsonb("final_score").$type<FinalScore | null>(),
  playerStats: jsonb("player_stats").$type<PlayerStat[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EventRow = typeof eventsTable.$inferSelect;
