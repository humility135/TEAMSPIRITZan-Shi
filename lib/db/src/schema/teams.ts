import { pgTable, text, integer, jsonb, boolean, primaryKey } from "drizzle-orm/pg-core";

export type TeamRecord = { w: number; d: number; l: number; gf: number; ga: number };

export const teamsTable = pgTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  logoUrl: text("logo_url").notNull().default(""),
  accentColor: text("accent_color").notNull().default("#84cc16"),
  district: text("district"),
  level: integer("level"),
  isPro: boolean("is_pro").notNull().default(false),
  inviteCode: text("invite_code"),
  record: jsonb("record").$type<TeamRecord>().notNull().default({ w: 0, d: 0, l: 0, gf: 0, ga: 0 }),
});

export const teamMembersTable = pgTable("team_members", {
  teamId: text("team_id").notNull().references(() => teamsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.teamId, t.userId] }) }));

export type Team = typeof teamsTable.$inferSelect;
export type TeamMember = typeof teamMembersTable.$inferSelect;
