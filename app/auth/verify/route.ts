import { and, eq, gt, isNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { authTokens } from "@/lib/db/schema";
import { hashToken, homeFor, startSession } from "@/lib/auth/session";
import { upsertProfile } from "@/lib/auth/profiles";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/sign-in?error=link", request.url));
  const db = await getDb();
  const [row] = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.tokenHash, hashToken(token)), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())))
    .returning();
  if (!row) return NextResponse.redirect(new URL("/sign-in?error=link", request.url));
  const profile = await upsertProfile(db, { email: row.email });
  await startSession(profile.id);
  return NextResponse.redirect(new URL(homeFor(profile.role), request.url));
}
