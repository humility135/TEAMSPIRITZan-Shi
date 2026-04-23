import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const ordersTable = sqliteTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(),
  refId: text("ref_id").notNull(),
  amount: integer("amount").notNull(),
  feeAmount: integer("fee_amount").notNull().default(0),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  paidAt: integer("paid_at", { mode: "timestamp" }),
});

export type OrderRow = typeof ordersTable.$inferSelect;