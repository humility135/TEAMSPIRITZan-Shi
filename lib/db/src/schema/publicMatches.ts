import { pgTable, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import type { SlotOffer } from "./events";

export const publicMatchesTable = pgTable("public_matches", {
  id: text("id").primaryKey(),
  hostId: text("host_id").notNull(),
  venueId: text("venue_id"),
  venueAddress: text("venue_address"),
  datetime: timestamp("datetime", { withTimezone: true }).notNull(),
  endDatetime: timestamp("end_datetime", { withTimezone: true }),
  fee: integer("fee").notNull().default(0),
  surface: text("surface").notNull(),
  skillLevel: integer("skill_level").notNull().default(3),
  maxPlayers: integer("max_players"),
  attendees: text("attendees").array().notNull().default([]),
  description: text("description").notNull().default(""),
  rules: text("rules").notNull().default(""),
  refundPolicy: text("refund_policy").notNull().default("half"),
  status: text("status").notNull().default("open"),
  isVerified: boolean("is_verified").notNull().default(false),
  waitlistIds: text("waitlist_ids").array().notNull().default([]),
  slotOffers: jsonb("slot_offers").$type<SlotOffer[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const matchCommentsTable = pgTable("match_comments", {
  id: text("id").primaryKey(),
  matchId: text("match_id").notNull(),
  userId: text("user_id").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PublicMatchRow = typeof publicMatchesTable.$inferSelect;
export type MatchCommentRow = typeof matchCommentsTable.$inferSelect;
