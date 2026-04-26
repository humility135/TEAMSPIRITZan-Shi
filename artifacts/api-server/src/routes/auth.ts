import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { OAuth2Client } from "google-auth-library";
import {
  setSessionCookie,
  clearSessionCookie,
  getUserIdFromReq,
  normalizePhone,
} from "../lib/auth";
import { newId } from "../lib/ids";

const router: IRouter = Router();
const googleClient = new OAuth2Client(); // Uses GOOGLE_CLIENT_ID from env if needed, or we can verify audience

const RequestOtpBody = z.object({ phone: z.string().min(8) });
const VerifyOtpBody = z.object({
  phone: z.string().min(8),
  code: z.string().min(4),
  name: z.string().min(1).max(40).optional(),
});

const GoogleAuthBody = z.object({
  token: z.string().min(1),
});

const MOCK_OTP = "123456";

router.post("/auth/google", async (req, res): Promise<void> => {
  const parsed = GoogleAuthBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid token" }); return; }

  try {
    const { token } = parsed.data;
    
    // We expect the access_token here, so we fetch the user info
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info from Google');
    }
    
    const userInfo = await response.json();
    const { sub: googleId, email, name, picture } = userInfo;

    if (!googleId || !email) {
      res.status(400).json({ error: "Invalid user info from Google" });
      return;
    }

    let [user] = await db.select().from(usersTable).where(eq(usersTable.googleId, googleId));
    
    // Fallback: try finding by email if googleId is not found (e.g. they registered via email earlier)
    if (!user) {
      [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
      
      if (user) {
        // Link googleId to existing account
        [user] = await db.update(usersTable)
          .set({ googleId })
          .where(eq(usersTable.id, user.id))
          .returning();
      }
    }

    if (!user) {
      const id = newId("u");
      const fallbackName = name || email.split('@')[0] || `User${id.slice(-4)}`;
      [user] = await db.insert(usersTable).values({
        id, 
        googleId,
        email,
        name: fallbackName,
        avatarUrl: picture || `https://i.pravatar.cc/150?u=${id}`,
        tokensBalance: 0, 
        subscription: "free",
        seasonStatsByTeam: {},
      }).returning();
    }

    setSessionCookie(res, user.id);
    res.json({ user });
  } catch (error) {
    req.log.error({ err: error }, "Google auth failed");
    res.status(401).json({ error: "Google 驗證失敗" });
  }
});

router.post("/auth/test-login", async (req, res): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "Forbidden in production" });
    return;
  }

  const testPhone = "00000000";
  let [user] = await db.select().from(usersTable).where(eq(usersTable.phone, testPhone));

  if (!user) {
    const id = newId("u");
    [user] = await db.insert(usersTable).values({
      id,
      phone: testPhone,
      name: "測試帳號 (Test User)",
      avatarUrl: `https://i.pravatar.cc/150?u=${id}`,
      tokensBalance: 100,
      subscription: "pro",
      seasonStatsByTeam: {},
    }).returning();
  }

  setSessionCookie(res, user.id);
  res.json({ user, message: "Logged in with test account" });
});

router.post("/auth/request-otp", async (req, res): Promise<void> => {
  const parsed = RequestOtpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid phone" }); return; }
  const phone = normalizePhone(parsed.data.phone);
  req.log.info({ phone }, `[Mock SMS] OTP for ${phone}: ${MOCK_OTP}`);
  res.json({ ok: true, hint: `Demo OTP: ${MOCK_OTP}` });
});

router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  if (parsed.data.code !== MOCK_OTP) { res.status(401).json({ error: "驗證碼錯誤" }); return; }
  const phone = normalizePhone(parsed.data.phone);

  let [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (!user) {
    const id = newId("u");
    const fallbackName = parsed.data.name?.trim() || `球員${phone.slice(-4)}`;
    [user] = await db.insert(usersTable).values({
      id, phone, name: fallbackName,
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
