"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { config, supabaseAuthEnabled } from "@/lib/config";
import { getDb } from "@/lib/db";
import { authTokens, profiles } from "@/lib/db/schema";
import { endSession, hashToken, homeFor, newToken, requireViewer, startSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/auth/supabase";
import { DEMO_PLANNER_EMAIL, DEMO_VENDOR_EMAIL } from "@/lib/demo";

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function demoSignIn(formData: FormData) {
  if (!config.demoMode) throw new Error("Demo sign-in is disabled");
  const who = formData.get("who") === "vendor" ? DEMO_VENDOR_EMAIL : DEMO_PLANNER_EMAIL;
  const db = await getDb();
  const [profile] = await db.select().from(profiles).where(eq(profiles.email, who)).limit(1);
  if (!profile) redirect("/sign-in?error=demo-missing");
  await startSession(profile.id);
  redirect(homeFor(profile.role));
}

export type MagicLinkState = { status: "idle" | "sent" | "error"; message?: string; devLink?: string };

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");

export async function requestMagicLink(_prev: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const email = parsed.data;
  const base = await origin();

  if (supabaseAuthEnabled) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${base}/auth/callback` },
    });
    if (error) return { status: "error", message: error.message };
    return { status: "sent", message: `Check ${email} for your sign-in link.` };
  }

  // Local mode: no email provider, so the link is shown on screen (and logged).
  const token = newToken();
  const db = await getDb();
  await db.insert(authTokens).values({
    tokenHash: hashToken(token),
    email,
    expiresAt: new Date(Date.now() + 15 * 60_000),
  });
  const link = `${base}/auth/verify?token=${token}`;
  console.log(`[eventually] magic link for ${email}: ${link}`);
  return {
    status: "sent",
    message: `Link ready for ${email}.`,
    devLink: config.demoMode || process.env.NODE_ENV !== "production" ? `/auth/verify?token=${token}` : undefined,
  };
}

export async function signInWithGoogle() {
  if (!supabaseAuthEnabled) redirect("/sign-in?error=google-unconfigured");
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await origin()}/auth/callback` },
  });
  if (error || !data.url) redirect(`/sign-in?error=google`);
  redirect(data.url);
}

export async function signOut() {
  if (supabaseAuthEnabled) {
    try {
      await (await supabaseServer()).auth.signOut();
    } catch {
      // Supabase session may already be gone; the app session is what matters.
    }
  }
  await endSession();
  redirect("/");
}

export async function chooseRole(formData: FormData) {
  const viewer = await requireViewer();
  const role = z.enum(["planner", "vendor"]).parse(formData.get("role"));
  const name = z.string().trim().max(60).optional().parse(formData.get("displayName") ?? undefined);
  const db = await getDb();
  await db
    .update(profiles)
    .set({ role, ...(name ? { displayName: name } : {}) })
    .where(eq(profiles.id, viewer.id));
  redirect(role === "planner" ? "/onboarding/planner" : "/onboarding/vendor");
}
