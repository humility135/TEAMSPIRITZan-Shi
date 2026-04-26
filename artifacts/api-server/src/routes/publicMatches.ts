import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import {
  db, publicMatchesTable, matchCommentsTable, ordersTable,
  type SlotOffer,
} from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import { newId } from "../lib/ids";
import { notify, notifyMany } from "../lib/notify";
import { hoursUntil, makeSlotOffer, tiedUpSet, PAYMENT_WINDOW_MINUTES } from "../lib/slotOffer";

const router: IRouter = Router();

router.get("/public-matches", async (_req, res): Promise<void> => {
  const rows = await db.select().from(publicMatchesTable);
  res.json(rows);
});

router.get("/match-comments", async (_req, res): Promise<void> => {
  const rows = await db.select().from(matchCommentsTable).orderBy(asc(matchCommentsTable.createdAt));
  res.json(rows);
});

router.get("/public-matches/:id", async (req, res): Promise<void> => {
  const [row] = await db.select().from(publicMatchesTable).where(eq(publicMatchesTable.id, String(req.params.id)));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

const CreateMatchBody = z.object({
  venueAddress: z.string().optional(),
  datetime: z.string(),
  endDatetime: z.string().optional(),
  fee: z.number().int().nonnegative(),
  surface: z.enum(["hard", "turf", "grass"]),
  skillLevel: z.number().int().min(1).max(5),
  maxPlayers: z.number().int().nullable(),
  description: z.string().optional(),
  rules: z.string().optional(),
  refundPolicy: z.enum(["half", "auto"]).default("half"),
  isVerified: z.boolean().optional(),
  waitlistIds: z.array(z.string()).optional(),
  slotOffers: z.array(z.any()).optional(),
});

router.post("/public-matches", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateMatchBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const me = (req as AuthedRequest).user;
  const id = newId("pm");
  const [row] = await db.insert(publicMatchesTable).values({
    id, hostId: me.id,
    venueAddress: parsed.data.venueAddress,
    datetime: new Date(parsed.data.datetime),
    endDatetime: parsed.data.endDatetime ? new Date(parsed.data.endDatetime) : undefined,
    fee: parsed.data.fee, surface: parsed.data.surface,
    skillLevel: parsed.data.skillLevel, maxPlayers: parsed.data.maxPlayers,
    description: parsed.data.description ?? "", rules: parsed.data.rules ?? "",
    refundPolicy: parsed.data.refundPolicy,
    status: "open",
    attendees: [], waitlistIds: [], slotOffers: [], // Host is NOT automatically added as an attendee
  }).returning();
  res.status(201).json(row);
});

router.post("/public-matches/:id/join", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const id = String(req.params.id);
  const [m] = await db.select().from(publicMatchesTable).where(eq(publicMatchesTable.id, id));
  if (!m) { res.status(404).json({ error: "Not found" }); return; }
  if (m.attendees.includes(me.id) || m.waitlistIds.includes(me.id)) { res.json(m); return; }
  const cap = m.maxPlayers;
  const hasRoom = cap == null || m.attendees.length < cap;
  let updated;
  
  // If the user joining is the host, they shouldn't need to pay, but we'll add them directly if there's room
  // The actual payment bypassing logic for hosts usually sits in the client/frontend flow,
  // but if the host calls join, we let them join directly.
  if (hasRoom) {
    const attendees = [...m.attendees, me.id];
    const status = cap != null && attendees.length >= cap ? "full" : m.status;
    [updated] = await db.update(publicMatchesTable).set({ attendees, status }).where(eq(publicMatchesTable.id, id)).returning();
  } else {
    const waitlistIds = [...m.waitlistIds, me.id];
    [updated] = await db.update(publicMatchesTable).set({ waitlistIds }).where(eq(publicMatchesTable.id, id)).returning();
    await notify(me.id, `已加入候補：公開場（第 ${waitlistIds.length} 位）`);
  }
  res.json(updated);
});

router.post("/public-matches/:id/leave", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const id = String(req.params.id);
  const [m] = await db.select().from(publicMatchesTable).where(eq(publicMatchesTable.id, id));
  if (!m) { res.status(404).json({ error: "Not found" }); return; }
  const wasAttending = m.attendees.includes(me.id);
  const attendees = m.attendees.filter((x) => x !== me.id);
  let waitlistIds = m.waitlistIds.filter((x) => x !== me.id);
  let slotOffers: SlotOffer[] = m.slotOffers
    .filter((o) => o.acceptedBy !== me.id)
    .map((o) => ({ ...o, eligibleUserIds: o.eligibleUserIds.filter((x) => x !== me.id) }))
    .filter((o) => o.eligibleUserIds.length > 0 || o.acceptedBy);
  const cap = m.maxPlayers;
  let status: string = m.status === "full" ? "open" : m.status;
  const notifs: Array<{ userId: string; message: string }> = [];

  if (wasAttending && waitlistIds.length > 0 && (cap == null || attendees.length < cap)) {
    const tied = tiedUpSet(slotOffers);
    const freeWl = waitlistIds.filter((x) => !tied.has(x));
    if (freeWl.length > 0) {
      if (m.fee === 0) {
        const promoted = freeWl[0];
        waitlistIds = waitlistIds.filter((x) => x !== promoted);
        attendees.push(promoted);
        if (cap != null && attendees.length >= cap) status = "full";
        notifs.push({ userId: promoted, message: "你已自動補上公開場（免費活動）" });
      } else {
        const hLeft = hoursUntil(new Date(m.datetime as unknown as string));
        const offer = makeSlotOffer(freeWl, hLeft);
        if (offer) {
          slotOffers.push(offer);
          const label = offer.mode === "race" ? "搶位中" : "輪到你";
          for (const uid of offer.eligibleUserIds) {
            notifs.push({ userId: uid, message: `【${label}】公開場有位空出，1 小時內接受並付款，逾時下一位補上` });
          }
        }
      }
    }
  }
  const [updated] = await db.update(publicMatchesTable)
    .set({ attendees, waitlistIds, slotOffers, status })
    .where(eq(publicMatchesTable.id, id)).returning();
  for (const n of notifs) await notify(n.userId, n.message);
  res.json(updated);
});

router.post("/public-matches/:id/cancel", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const id = String(req.params.id);
  const [m] = await db.select().from(publicMatchesTable).where(eq(publicMatchesTable.id, id));
  if (!m) { res.status(404).json({ error: "Not found" }); return; }
  if (m.hostId !== me.id) { res.status(403).json({ error: "Forbidden" }); return; }
  const [updated] = await db.update(publicMatchesTable).set({ status: "cancelled" }).where(eq(publicMatchesTable.id, id)).returning();
  res.json(updated);
});

router.delete("/public-matches/:id", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const id = String(req.params.id);
  const [m] = await db.select().from(publicMatchesTable).where(eq(publicMatchesTable.id, id));
  if (!m) { res.status(404).json({ error: "Not found" }); return; }
  // Allow host to delete, OR allow any admin (if you had admin logic, otherwise just host)
  if (m.hostId !== me.id) { res.status(403).json({ error: "Forbidden" }); return; }
  
  // First delete any associated comments or slot offers to avoid foreign key constraints
  await db.delete(matchCommentsTable).where(eq(matchCommentsTable.matchId, id));
  
  // Then delete the match itself
  await db.delete(publicMatchesTable).where(eq(publicMatchesTable.id, id));
  res.json({ ok: true });
});

router.post("/public-matches/:id/slot-offers/:offerId/accept", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const id = String(req.params.id); const offerId = String(req.params.offerId);
  const [m] = await db.select().from(publicMatchesTable).where(eq(publicMatchesTable.id, id));
  if (!m) { res.status(404).json({ error: "Not found" }); return; }
  const offer = m.slotOffers.find((o) => o.id === offerId);
  if (!offer || !offer.eligibleUserIds.includes(me.id) || offer.acceptedBy) {
    res.status(409).json({ error: "Offer not available" }); return;
  }
  if (m.fee === 0) {
    const attendees = [...m.attendees, me.id];
    const waitlistIds = m.waitlistIds.filter((x) => x !== me.id);
    const slotOffers = m.slotOffers.filter((o) => o.id !== offerId);
    const cap = m.maxPlayers;
    const status = cap != null && attendees.length >= cap ? "full" : m.status;
    const [updated] = await db.update(publicMatchesTable)
      .set({ attendees, waitlistIds, slotOffers, status })
      .where(eq(publicMatchesTable.id, id)).returning();
    await notify(me.id, "你已補上公開場");
    res.json({ match: updated, needPayment: false });
    return;
  }
  const deadline = new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60000).toISOString();
  const slotOffers = m.slotOffers.map((o) =>
    o.id === offerId ? { ...o, acceptedBy: me.id, paymentDeadline: deadline, eligibleUserIds: [me.id] } : o,
  );
  const [updated] = await db.update(publicMatchesTable).set({ slotOffers }).where(eq(publicMatchesTable.id, id)).returning();
  res.json({ match: updated, needPayment: true });
});

router.post("/public-matches/:id/slot-offers/:offerId/pay", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const id = String(req.params.id); const offerId = String(req.params.offerId);
  const [m] = await db.select().from(publicMatchesTable).where(eq(publicMatchesTable.id, id));
  if (!m) { res.status(404).json({ error: "Not found" }); return; }
  const offer = m.slotOffers.find((o) => o.id === offerId);
  if (!offer || offer.acceptedBy !== me.id) { res.json({ ok: false, reason: "expired" }); return; }
  if (offer.paymentDeadline && new Date(offer.paymentDeadline).getTime() < Date.now()) {
    res.json({ ok: false, reason: "expired" }); return;
  }
  const cap = m.maxPlayers;
  if (cap != null && m.attendees.length >= cap) { res.json({ ok: false, reason: "full" }); return; }
  if (m.attendees.includes(me.id)) { res.json({ ok: true }); return; }
  const attendees = [...m.attendees, me.id];
  const waitlistIds = m.waitlistIds.filter((x) => x !== me.id);
  const slotOffers = m.slotOffers.filter((o) => o.id !== offerId);
  const status = cap != null && attendees.length >= cap ? "full" : m.status;
  const [updated] = await db.update(publicMatchesTable)
    .set({ attendees, waitlistIds, slotOffers, status })
    .where(eq(publicMatchesTable.id, id)).returning();
  const orderId = newId("ord");
  await db.insert(ordersTable).values({
    id: orderId, userId: me.id, kind: "match_slot", refId: m.id,
    amount: m.fee, status: "paid", paidAt: new Date(),
  });
  await notify(me.id, "付款成功，已補上公開場");
  res.json({ ok: true, match: updated, orderId });
});

router.post("/public-matches/:id/slot-offers/:offerId/decline", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const id = String(req.params.id); const offerId = String(req.params.offerId);
  const [m] = await db.select().from(publicMatchesTable).where(eq(publicMatchesTable.id, id));
  if (!m) { res.status(404).json({ error: "Not found" }); return; }
  const targetOffer = m.slotOffers.find((o) => o.id === offerId);
  if (!targetOffer) { res.status(404).json({ error: "Offer not found" }); return; }
  const isEligible = targetOffer.eligibleUserIds.includes(me.id) || targetOffer.acceptedBy === me.id;
  if (!isEligible) { res.status(403).json({ error: "Not your offer" }); return; }
  const waitlistIds = m.waitlistIds.filter((x) => x !== me.id);
  const reopenedTo: string[] = [];
  const slotOffers = m.slotOffers.map((o) => {
    if (o.id !== offerId) return o;
    const eligible = waitlistIds.length === 0 ? [] : (o.mode === "race" ? [...waitlistIds] : waitlistIds.slice(0, 1));
    if (eligible.length > 0) reopenedTo.push(...eligible);
    return { ...o, acceptedBy: undefined, paymentDeadline: undefined, eligibleUserIds: eligible };
  }).filter((o) => o.eligibleUserIds.length > 0 || o.acceptedBy);
  const [updated] = await db.update(publicMatchesTable)
    .set({ waitlistIds, slotOffers })
    .where(eq(publicMatchesTable.id, id)).returning();
  await notifyMany(reopenedTo, "【補位再開】公開場 — 1 小時內接受並付款");
  res.json(updated);
});

router.get("/public-matches/:id/comments", async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const rows = await db.select().from(matchCommentsTable)
    .where(eq(matchCommentsTable.matchId, id))
    .orderBy(asc(matchCommentsTable.createdAt));
  res.json(rows);
});

router.post("/public-matches/:id/comments", requireAuth, async (req, res): Promise<void> => {
  const me = (req as AuthedRequest).user;
  const id = String(req.params.id);
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) { res.status(400).json({ error: "Empty comment" }); return; }
  const [row] = await db.insert(matchCommentsTable).values({
    id: newId("c"), matchId: id, userId: me.id, text,
  }).returning();
  res.status(201).json(row);
});

export default router;
