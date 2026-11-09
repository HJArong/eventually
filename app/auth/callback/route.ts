import { NextResponse, type NextRequest } from "next/server";
import { supabaseAuthEnabled } from "@/lib/config";
import { getDb } from "@/lib/db";
import { homeFor, startSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/auth/supabase";
import { upsertProfile } from "@/lib/auth/profiles";

/** Supabase redirects here after a magic link or Google sign-in. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!supabaseAuthEnabled || !code) return NextResponse.redirect(new URL("/sign-in?error=link", request.url));
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  const user = data?.user;
  if (error || !user?.email) return NextResponse.redirect(new URL("/sign-in?error=link", request.url));
  const db = await getDb();
  const profile = await upsertProfile(db, {
    id: user.id,
    email: user.email,
    displayName: (user.user_metadata?.full_name as string | undefined) ?? null,
  });
  await startSession(profile.id);
  return NextResponse.redirect(new URL(homeFor(profile.role), request.url));
}
