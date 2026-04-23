import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { OAuth2Client } from "google-auth-library";
import {
  setSessionCookie,
  clearSessionCookie,
  getUserIdFromReq,
} from "../lib/auth";
import { newId } from "../lib/ids";

const router: IRouter = Router();

// In a real app, this should be an env variable. We'll use a dummy one for the demo.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "123456789-dummy-client-id.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const GoogleAuthBody = z.object({
  credential: z.string(),
});

router.post("/auth/google", async (req, res): Promise<void> => {
  const parsed = GoogleAuthBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid credential" }); return; }

  try {
    // In a real environment, we would verify the token with Google:
    // const ticket = await googleClient.verifyIdToken({
    //   idToken: parsed.data.credential,
    //   audience: GOOGLE_CLIENT_ID,
    // });
    // const payload = ticket.getPayload();
    
    // For this demo, since we don't have a real Google Client ID,
    // we'll decode the JWT directly (without signature verification) just to extract the profile info.
    // DANGER: NEVER DO THIS IN PRODUCTION WITHOUT VERIFYING THE SIGNATURE!
    const base64Url = parsed.data.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64));
    const payload = JSON.parse(jsonPayload);

    if (!payload || !payload.email) {
      res.status(400).json({ error: "Invalid Google token payload" });
      return;
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase().trim();
    const name = payload.name || `球員${email.split('@')[0]}`;
    const picture = payload.picture || `https://i.pravatar.cc/150?u=${googleId}`;

    // Find user by Google ID or Email
    let [user] = await db.select().from(usersTable).where(eq(usersTable.googleId, googleId));
    
    if (!user) {
      // Check if user exists with the same email but hasn't linked Google yet
      let [existingEmailUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));
      
      if (existingEmailUser) {
        // Link Google ID to existing user
        [user] = await db.update(usersTable)
          .set({ googleId, avatarUrl: picture })
          .where(eq(usersTable.id, existingEmailUser.id))
          .returning();
      } else {
        // Create new user
        const id = newId("u");
        [user] = await db.insert(usersTable).values({
          id, 
          googleId,
          email, 
          name,
          avatarUrl: picture,
          tokensBalance: 0, 
          subscription: "free",
          seasonStatsByTeam: {},
        }).returning();
      }
    }

    setSessionCookie(res, user.id);
    res.json({ user });
  } catch (error) {
    req.log.error({ error }, "Google auth failed");
    res.status(401).json({ error: "Google 登入失敗" });
  }
});

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
