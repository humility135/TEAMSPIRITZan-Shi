import type { SlotOffer } from "@workspace/db";
import { newId } from "./ids";

export const RACE_THRESHOLD_HOURS = 24;
export const PAYMENT_WINDOW_MINUTES = 60;

export function hoursUntil(d: Date): number {
  return (d.getTime() - Date.now()) / 3600000;
}

export function makeSlotOffer(waitlistIds: string[], hoursLeft: number): SlotOffer | null {
  if (waitlistIds.length === 0) return null;
  const isRace = hoursLeft <= RACE_THRESHOLD_HOURS;
  return {
    id: newId("offer"),
    mode: isRace ? "race" : "fifo",
    eligibleUserIds: isRace ? [...waitlistIds] : waitlistIds.slice(0, 1),
    createdAt: new Date().toISOString(),
  };
}

export function tiedUpSet(offers: SlotOffer[]): Set<string> {
  return new Set<string>(
    offers.flatMap((o) => [...o.eligibleUserIds, ...(o.acceptedBy ? [o.acceptedBy] : [])]),
  );
}

/** Sweep expired payment-deadlines in-memory. Returns updated state + notifications to send. */
export function expireOffers<T extends { slotOffers: SlotOffer[]; waitlistIds: string[] }>(
  item: T,
): { item: T; reopenedTitles: string[]; changed: boolean } {
  const offers = [...(item.slotOffers ?? [])];
  const wl = [...(item.waitlistIds ?? [])];
  let changed = false;
  const reopenedTitles: string[] = [];
  const now = Date.now();
  for (let i = 0; i < offers.length; i++) {
    const o = offers[i];
    if (o.acceptedBy && o.paymentDeadline && new Date(o.paymentDeadline).getTime() < now) {
      const expired = o.acceptedBy;
      const idx = wl.indexOf(expired);
      if (idx >= 0) wl.splice(idx, 1);
      const eligible = wl.length === 0 ? [] : (o.mode === "race" ? [...wl] : wl.slice(0, 1));
      if (eligible.length === 0) {
        offers.splice(i, 1); i--;
      } else {
        offers[i] = { ...o, acceptedBy: undefined, paymentDeadline: undefined, eligibleUserIds: eligible };
        reopenedTitles.push("reopened");
      }
      changed = true;
    }
  }
  if (!changed) return { item, reopenedTitles: [], changed: false };
  return { item: { ...item, slotOffers: offers, waitlistIds: wl }, reopenedTitles, changed: true };
}
