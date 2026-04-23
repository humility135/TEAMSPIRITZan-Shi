import { pgTable, text, real, jsonb } from "drizzle-orm/pg-core";

export type Weather = { temp: number; condition: string; lightningWarning: boolean };

export const venuesTable = pgTable("venues", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  district: text("district").notNull(),
  address: text("address").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  surface: text("surface").notNull(),
  weather: jsonb("weather").$type<Weather>().notNull(),
});

export type Venue = typeof venuesTable.$inferSelect;
