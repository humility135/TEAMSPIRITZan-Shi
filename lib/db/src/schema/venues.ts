import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";

export type Weather = { temp: number; condition: string; lightningWarning: boolean };

export const venuesTable = sqliteTable("venues", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  district: text("district").notNull(),
  address: text("address").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  surface: text("surface").notNull(),
  weather: text("weather", { mode: 'json' }).$type<Weather>().notNull(),
});

export type Venue = typeof venuesTable.$inferSelect;
