const env = process.env;

/**
 * Serverless functions (Netlify, Vercel, AWS Lambda) run from a read-only bundle; only /tmp is
 * writable and it is not shared between instances.
 */
export const serverless = Boolean(env.NETLIFY || env.VERCEL || env.AWS_LAMBDA_FUNCTION_NAME || env.LAMBDA_TASK_ROOT);

export const config = {
  /** Demo logins, "Reset demo" and the auto-responder. On unless DEMO_MODE=false. */
  demoMode: env.DEMO_MODE !== "false",
  autoResponder: env.DEMO_MODE !== "false" && env.DEMO_AUTO_RESPONDER !== "false",
  /** Seconds before a seeded vendor auto-quotes. */
  autoReplyDelaySeconds: Math.max(0, Number(env.DEMO_AUTO_REPLY_DELAY ?? 6) || 0),
  /** NETLIFY_DATABASE_URL is set by the Netlify DB (Neon) extension. */
  databaseUrl: env.DATABASE_URL || env.NETLIFY_DATABASE_URL || null,
  /** "memory" keeps PGlite in RAM. Serverless hosts default to it because their disk is read-only. */
  pgliteDir: env.PGLITE_DIR || (serverless ? "memory" : ".data/pglite"),
  uploadsDir: env.UPLOADS_DIR || (serverless ? "/tmp/eventually-uploads" : ".data/uploads"),
  supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL || null,
  supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null,
  supabaseStorageBucket: env.SUPABASE_STORAGE_BUCKET || "media",
  supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || null,
  authSecret: env.AUTH_SECRET || null,
};

export const supabaseAuthEnabled = Boolean(config.supabaseUrl && config.supabaseAnonKey);
