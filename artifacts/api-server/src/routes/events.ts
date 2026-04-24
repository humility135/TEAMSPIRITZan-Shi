import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, eventsTable, ordersTable, type EventRow, type SlotOffer, type PlayerStat } from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import { newId } from "../lib/ids";
import { notify, notifyMany } from "../lib/notify";
import { hoursUntil, makeSlotOffer, tiedUpSet, PAYMENT_WINDOW_MINUTES } from "../lib/slotOffer";

const router: IRouter = Router();

router.get("/events", async (_req, res): Promise<void> => {
  const rows = await db.select().from(eventsTable);
  res.json(rows);
});

router.get("/events/:id", async (req, res): Promise<void> => {
  const [row] = await db.select().from(eventsTable).where(eq(eventsTable.id, String(req.params.id)));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

const CreateEventBody = z.object({
  teamId: z.string(), title: z.string().min(1),
  datetime: z.string(), endDatetime: z.string(),
  venueAddress: z.string().optional(),
  surface: z.enum(["hard", "turf", "grass"]).optional(),
  skillLevel: z.number().int().optional(),
  fee: z.number().int().nonnegative(),
  capacity: z.number().int().nullable(),
  description: z.string().optional(),
  rules: z.string().optional(),
});

router.post("/events", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const me = (req as AuthedRequest).user;
  const id = newId("e");
  const [row] = await db.insert(eventsTable).values({
    id, teamId: parsed.data.teamId, title: parsed.data.title,
    datetime: new Date(parsed.data.datetime),
    endDatetime: new Date(parsed.data.endDatetime),
    venueAddress: parsed.data.venueAddress,
    surface: parsed.data.surface, skillLevel: parsed.data.skillLevel,
    fee: parsed.data.fee, capacity: parsed.data.capacity,
    description: parsed.data.description, rules: parsed.data.rules,
    status: "scheduled",
    attendingIds: [], declinedIds: [], waitlistIds: [], slotOffers: [], playerStats: [],
  }).returning();
  res.status(201).json(row);
});

const RsvpBody = z.object({ status: z.enum(["attending", "declined", "none"]) });

router.put("/events/:id/rsvp", requireAuth, async (req, res): Promise<void> => {
  const parsed = RsvpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const me = (req as AuthedRequest).user;
  const id = String(req.params.id);
  const [e] = await db.select().from(eventsTable).where(eq(eventsTable.id, id));
  if (!e) { res.status(404).json({ error: "Not found" }); return; }

  const wasAttending = e.attendingIds.includes(me.id);
  let attendingIds = e.attendingIds.filter((x) => x !== me.id);
  let declinedIds = e.declinedIds.filter((x) => x !== me.id);
  let waitlistIds = e.waitlistIds.filter((x) => x !== me.id);
  let slotOffers: SlotOffer[] = e.slotOffers
    .filter((o) => o.acceptedBy !== me.id)
    .map((o) => ({ ...o, eligibleUserIds: o.eligibleUserIds.filter((x) => x !== me.id) }))
    .filter((o) => o.eligibleUserIds.length > 0 || o.acceptedBy);

  const cap = e.capacity;
  const notifs: Array<{ userId: string; message: string }> = [];

  if (parsed.data.status === "attending") {
    if (cap == null || attendingIds.length < cap) {
      attendingIds.push(me.id);
    } else {
      waitlistIds.push(me.id);
      notifs.push({ userId: me.id, message: `已加入候補：${e.title}（第 ${waitlistIds.length} 位）` });
    }
  }
  if (parsed.data.status === "declined") declinedIds.push(me.id);

  // drop triggers offer
  if (wasAttending && parsed.data.status !== "attending" && waitlistIds.length > 0 && (cap == null || attendingIds.length < cap)) {
    const tied = tiedUpSet(slotOffers);
    const freeWl = waitlistIds.filter((x) => !tied.has(x));
    if (freeWl.length > 0) {
      const hLeft = hoursUntil(e.datetime as unknown as Date);
      if (e.fee === 0) {
        const promoted = freeWl[0];
        waitlistIds = waitlistIds.filter((x) => x !== promoted);
        attendingIds.push(promoted);
        notifs.push({ userId: promoted, message: `你已自動補上：${e.title}（免費活動）` });
      } else {
        const offer = makeSlotOffer(freeWl, hLeft);
        if (offer) {
          slotOffers.push(offer);
          const label = offer.mode === "race" ? "搶位中" : "輪到你";
          for (const uid of offer.eligibleUserIds) {
            notifs.push({ userId: uid, message: `【${label}】${e.title} 有位空出，1 小時內接受並付款，逾時下一位補上` });
          }
        }
      }
    }
  }

  const [updated] = await db.update(eventsTable)
    .set({ attendingIds, declinedIds, waitlistIds, slotOffers })
    .where(eq(eventsTable.id, id)).returning();

  for (const n of notifs) await notify(n.userId, n.message);
  res.json(updated);
});

router.post("/events/:id/slot-offers/:offerId/accept", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const id = String(req.params.id);
  const offerId = String(req.params.offerId);
  const [e] = await db.select().from(eventsTable).where(eq(eventsTable.id, id));
  if (!e) { res.status(404).json({ error: "Not found" }); return; }
  const offer = e.slotOffers.find((o) => o.id === offerId);
  if (!offer || !offer.eligibleUserIds.includes(me.id) || offer.acceptedBy) {
    res.status(409).json({ error: "Offer not available" }); return;
  }

  if (e.fee === 0) {
    const attendingIds = [...e.attendingIds, me.id];
    const waitlistIds = e.waitlistIds.filter((x) => x !== me.id);
    const slotOffers = e.slotOffers.filter((o) => o.id !== offerId);
    const [updated] = await db.update(eventsTable)
      .set({ attendingIds, waitlistIds, slotOffers })
      .where(eq(eventsTable.id, id)).returning();
    await notify(me.id, `你已補上：${e.title}`);
    res.json({ event: updated, needPayment: false });
    return;
  }

  const deadline = new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60000).toISOString();
  const slotOffers = e.slotOffers.map((o) =>
    o.id === offerId ? { ...o, acceptedBy: me.id, paymentDeadline: deadline, eligibleUserIds: [me.id] } : o,
  );
  const [updated] = await db.update(eventsTable).set({ slotOffers }).where(eq(eventsTable.id, id)).returning();
  res.json({ event: updated, needPayment: true });
});

router.post("/events/:id/slot-offers/:offerId/pay", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const id = String(req.params.id);
  const offerId = String(req.params.offerId);
  const [e] = await db.select().from(eventsTable).where(eq(eventsTable.id, id));
  if (!e) { res.status(404).json({ error: "Not found" }); return; }
  const offer = e.slotOffers.find((o) => o.id === offerId);
  if (!offer || offer.acceptedBy !== me.id) { res.json({ ok: false, reason: "expired" }); return; }
  if (offer.paymentDeadline && new Date(offer.paymentDeadline).getTime() < Date.now()) {
    res.json({ ok: false, reason: "expired" }); return;
  }
  if (e.capacity != null && e.attendingIds.length >= e.capacity) { res.json({ ok: false, reason: "full" }); return; }
  if (e.attendingIds.includes(me.id)) { res.json({ ok: true }); return; }

  const attendingIds = [...e.attendingIds, me.id];
  const waitlistIds = e.waitlistIds.filter((x) => x !== me.id);
  const slotOffers = e.slotOffers.filter((o) => o.id !== offerId);
  const [updated] = await db.update(eventsTable)
    .set({ attendingIds, waitlistIds, slotOffers })
    .where(eq(eventsTable.id, id)).returning();
  const orderId = newId("ord");
  await db.insert(ordersTable).values({
    id: orderId, userId: me.id, kind: "event_slot", refId: e.id,
    amount: e.fee, status: "paid", paidAt: new Date(),
  });
  await notify(me.id, `付款成功，已補上：${e.title}`);
  res.json({ ok: true, event: updated, orderId });
});

router.post("/events/:id/slot-offers/:offerId/decline", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const id = String(req.params.id);
  const offerId = String(req.params.offerId);
  const [e] = await db.select().from(eventsTable).where(eq(eventsTable.id, id));
  if (!e) { res.status(404).json({ error: "Not found" }); return; }
  const targetOffer = e.slotOffers.find((o) => o.id === offerId);
  if (!targetOffer) { res.status(404).json({ error: "Offer not found" }); return; }
  const isEligible = targetOffer.eligibleUserIds.includes(me.id) || targetOffer.acceptedBy === me.id;
  if (!isEligible) { res.status(403).json({ error: "Not your offer" }); return; }
  const waitlistIds = e.waitlistIds.filter((x) => x !== me.id);
  const reopenedNotifs: string[] = [];
  let slotOffers = e.slotOffers.map((o) => {
    if (o.id !== offerId) return o;
    const eligible = waitlistIds.length === 0 ? [] : (o.mode === "race" ? [...waitlistIds] : waitlistIds.slice(0, 1));
    if (eligible.length > 0) reopenedNotifs.push(...eligible);
    return { ...o, acceptedBy: undefined, paymentDeadline: undefined, eligibleUserIds: eligible };
  }).filter((o) => o.eligibleUserIds.length > 0 || o.acceptedBy);
  const [updated] = await db.update(eventsTable)
    .set({ waitlistIds, slotOffers })
    .where(eq(eventsTable.id, id)).returning();
  await notifyMany(reopenedNotifs, `【補位再開】${e.title} — 1 小時內接受並付款`);
  res.json(updated);
});

const StatsBody = z.object({
  userId: z.string(),
  field: z.enum(["goals", "assists", "yellow", "red"]),
  delta: z.number().int(),
});

router.patch("/events/:id/stats", requireAuth, async (req, res): Promise<void> => {
  const parsed = StatsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const id = String(req.params.id);
  const [e] = await db.select().from(eventsTable).where(eq(eventsTable.id, id));
  if (!e) { res.status(404).json({ error: "Not found" }); return; }
  const playerStats: PlayerStat[] = [...e.playerStats];
  let s = playerStats.find((p) => p.userId === parsed.data.userId);
  if (!s) {
    s = { userId: parsed.data.userId, goals: 0, assists: 0, yellow: 0, red: 0 };
    playerStats.push(s);
  }
  s[parsed.data.field] = Math.max(0, s[parsed.data.field] + parsed.data.delta);
  const [updated] = await db.update(eventsTable).set({ playerStats }).where(eq(eventsTable.id, id)).returning();
  res.json(updated);
});

export default router;
