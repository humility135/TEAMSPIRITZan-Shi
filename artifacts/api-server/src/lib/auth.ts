import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { User } from "@workspace/db";

const SECRET = process.env.SESSION_SECRET ?? "dev-insecure-secret";
const COOKIE = "ts_session";
const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30d

function sign(userId: string): string {
  const sig = crypto.createHmac("sha256", SECRET).update(userId).digest("hex");
  return `${userId}.${sig}`;
}

function verify(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(userId).digest("hex");
  try {
    if (sig.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return userId;
}

export function setSessionCookie(res: Response, userId: string) {
  res.cookie(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: MAX_AGE,
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE, { path: "/" });
}

export function getUserIdFromReq(req: Request): string | null {
  const token = (req as any).cookies?.[COOKIE] as string | undefined;
  return verify(token);
}

export interface AuthedRequest extends Request {
  user: User;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = getUserIdFromReq(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!u) { res.status(401).json({ error: "Unauthorized" }); return; }
  (req as AuthedRequest).user = u;
  next();
}

export function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 8) return `+852${cleaned}`;
  return cleaned.startsWith("852") ? `+${cleaned}` : `+${cleaned}`;
}
