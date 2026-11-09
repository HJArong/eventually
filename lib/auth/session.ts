import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { config } from "@/lib/config";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export const SESSION_COOKIE = "ev_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const DEV_SECRET = "eventually-local-dev-secret-change-me";

function secret(): string {
  if (config.authSecret) return config.authSecret;
  if (process.env.VERCEL) throw new Error("AUTH_SECRET must be set in hosted environments");
  return DEV_SECRET;
}

export function signSession(profileId: string, issuedAt = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ uid: profileId, iat: issuedAt })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid?: string; iat?: number };
    if (!data.uid || !data.iat || now - data.iat > MAX_AGE_SECONDS * 1000) return null;
    return data.uid;
  } catch {
    return null;
  }
}

/** Only callable from Server Actions and Route Handlers. */
export async function startSession(profileId: string) {
  (await cookies()).set(SESSION_COOKIE, signSession(profileId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !process.env.EVENTUALLY_INSECURE_COOKIES,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export type Viewer = typeof profiles.$inferSelect;

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const uid = verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!uid) return null;
  const db = await getDb();
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, uid)).limit(1);
  return profile ?? null;
});

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  return viewer;
}

export async function requireRole(role: "planner" | "vendor" | "admin"): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!viewer.role) redirect("/onboarding");
  if (viewer.role !== role && !(role === "admin" && config.demoMode)) redirect(homeFor(viewer.role));
  return viewer;
}

export function homeFor(role: Viewer["role"]): string {
  if (role === "vendor") return "/vendor";
  if (role === "admin") return "/admin";
  if (role === "planner") return "/home";
  return "/onboarding";
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken(): string {
  return randomBytes(24).toString("base64url");
}
