const env = process.env;

export const config = {
  /** Demo logins, "Reset demo" and the auto-responder. On unless DEMO_MODE=false. */
  demoMode: env.DEMO_MODE !== "false",
  autoResponder: env.DEMO_MODE !== "false" && env.DEMO_AUTO_RESPONDER !== "false",
  /** Seconds before a seeded vendor auto-quotes. */
  autoReplyDelaySeconds: Math.max(0, Number(env.DEMO_AUTO_REPLY_DELAY ?? 6) || 0),
  databaseUrl: env.DATABASE_URL || null,
  pgliteDir: env.PGLITE_DIR || ".data/pglite",
  uploadsDir: env.UPLOADS_DIR || ".data/uploads",
  supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL || null,
  supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null,
  supabaseStorageBucket: env.SUPABASE_STORAGE_BUCKET || "media",
  supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || null,
  authSecret: env.AUTH_SECRET || null,
};

export const supabaseAuthEnabled = Boolean(config.supabaseUrl && config.supabaseAnonKey);
