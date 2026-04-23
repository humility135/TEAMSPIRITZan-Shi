import { eq } from "drizzle-orm";
import { db, eventsTable, publicMatchesTable } from "@workspace/db";
import { expireOffers } from "./slotOffer";
import { notifyMany } from "./notify";
import { logger } from "./logger";

const TICK_MS = 30_000;

async function tick() {
  try {
    const events = await db.select().from(eventsTable);
    for (const e of events) {
      const result = expireOffers(e);
      if (!result.changed) continue;
      await db.update(eventsTable)
        .set({ slotOffers: result.item.slotOffers, waitlistIds: result.item.waitlistIds })
        .where(eq(eventsTable.id, e.id));
      const reopenedUserIds = result.item.slotOffers.flatMap((o) => o.eligibleUserIds);
      await notifyMany(reopenedUserIds, `【補位再開】${e.title} — 1 小時內接受並付款`);
    }
    const matches = await db.select().from(publicMatchesTable);
    for (const m of matches) {
      const result = expireOffers(m);
      if (!result.changed) continue;
      await db.update(publicMatchesTable)
        .set({ slotOffers: result.item.slotOffers, waitlistIds: result.item.waitlistIds })
        .where(eq(publicMatchesTable.id, m.id));
      const reopenedUserIds = result.item.slotOffers.flatMap((o) => o.eligibleUserIds);
      await notifyMany(reopenedUserIds, "【補位再開】公開場 — 1 小時內接受並付款");
    }
  } catch (err) {
    logger.error({ err }, "Offer expiry tick failed");
  }
}

export function startOfferExpiryTick() {
  setInterval(tick, TICK_MS);
  logger.info({ tickMs: TICK_MS }, "Offer expiry tick started");
}
