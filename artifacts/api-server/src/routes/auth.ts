import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  setSessionCookie,
  clearSessionCookie,
  getUserIdFromReq,
} from "../lib/auth";
import { newId } from "../lib/ids";

const router: IRouter = Router();

const RequestOtpBody = z.object({ email: z.string().email() });
const VerifyOtpBody = z.object({
  email: z.string().email(),
  code: z.string().min(4),
  name: z.string().min(1).max(40).optional(),
});

const MOCK_OTP = "123456";

router.post("/auth/request-otp", async (req, res): Promise<void> => {
  const parsed = RequestOtpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid email" }); return; }
  const email = parsed.data.email.toLowerCase().trim();
  req.log.info({ email }, `[Mock Email] OTP for ${email}: ${MOCK_OTP}`);
  res.json({ ok: true, hint: `Demo OTP: ${MOCK_OTP}` });
});

router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  if (parsed.data.code !== MOCK_OTP) { res.status(401).json({ error: "驗證碼錯誤" }); return; }
  const email = parsed.data.email.toLowerCase().trim();

  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    const id = newId("u");
    const fallbackName = parsed.data.name?.trim() || `球員${email.split('@')[0]}`;
    [user] = await db.insert(usersTable).values({
      id, email, name: fallbackName,
      avatarUrl: `https://i.pravatar.cc/150?u=${id}`,
      tokensBalance: 0, subscription: "free",
      seasonStatsByTeam: {},
    }).returning();
  } else if (parsed.data.name && parsed.data.name.trim() && user.name.startsWith("球員")) {
    [user] = await db.update(usersTable)
      .set({ name: parsed.data.name.trim() })
      .where(eq(usersTable.id, user.id))
      .returning();
  }

  setSessionCookie(res, user.id);
  res.json({ user });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = getUserIdFromReq(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!u) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.json({ user: u });
});

export default router;
