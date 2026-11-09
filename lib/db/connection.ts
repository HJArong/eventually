import type { PoolConfig } from "pg";

/** A DATABASE_URL problem detected before connecting. Messages never include the password. */
export class DatabaseConfigError extends Error {
  override name = "DatabaseConfigError";
}

export type ParsedDatabaseUrl = {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
  params: URLSearchParams;
};

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Parses postgres:// URLs without `new URL()`, so passwords pasted without URL-encoding (`@ # / ? %`)
 * still work: the host starts after the last `@`. Percent-encoded parts are decoded.
 */
export function parseDatabaseUrl(raw: string): ParsedDatabaseUrl {
  const m = /^postgres(?:ql)?:\/\/(.*)@([^@/?#]+)(?:\/([^?#]*))?(?:\?([^#]*))?$/.exec(raw.trim());
  if (!m) {
    throw new DatabaseConfigError("DATABASE_URL must look like postgresql://user:password@host:port/database");
  }
  const [, userinfo, hostport, db, query] = m;
  const colon = userinfo!.indexOf(":");
  const user = safeDecode(colon === -1 ? userinfo! : userinfo!.slice(0, colon));
  const password = colon === -1 ? "" : safeDecode(userinfo!.slice(colon + 1));
  const hp = /^\[(.+)\](?::(\d+))?$/.exec(hostport!) ?? /^([^:]+)(?::(\d+))?$/.exec(hostport!);
  if (!hp) throw new DatabaseConfigError("DATABASE_URL has an invalid host:port");
  return {
    user,
    password,
    host: hp[1]!,
    port: Number(hp[2] ?? 5432),
    database: safeDecode(db || "postgres"),
    params: new URLSearchParams(query ?? ""),
  };
}

export const isSupabaseHost = (host: string) => /\.supabase\.(co|com)$/i.test(host);
export const isSupabasePooler = (host: string) => /\.pooler\.supabase\.com$/i.test(host);

/** Short, non-secret label for logs: host, port and pooler mode. */
export function describeTarget(url: ParsedDatabaseUrl): string {
  const mode = isSupabasePooler(url.host)
    ? url.port === 6543
      ? "Supabase transaction pooler"
      : "Supabase session pooler"
    : isSupabaseHost(url.host)
      ? "Supabase direct"
      : "Postgres";
  return `${mode} ${url.host}:${url.port}`;
}

function validate(url: ParsedDatabaseUrl) {
  if (!url.password) throw new DatabaseConfigError("DATABASE_URL has no password");
  if (/^\[.*\]$/.test(url.password) || /YOUR-PASSWORD/i.test(url.password)) {
    throw new DatabaseConfigError("DATABASE_URL still has the [YOUR-PASSWORD] placeholder; paste the password without brackets");
  }
  if (isSupabasePooler(url.host) && !/^[^.]+\.[a-z0-9]+$/i.test(url.user)) {
    throw new DatabaseConfigError(
      `Supabase pooler usernames look like postgres.<project-ref>, got "${url.user}"; copy the string from Connect in the Supabase dashboard`,
    );
  }
}

/**
 * SSL follows libpq: `require`/`prefer` encrypt without verifying, `verify-*` verify against Node's CAs
 * (or DATABASE_SSL_CA). Supabase is always encrypted; its certificates chain to Supabase's own root CA,
 * which Node doesn't ship, so without DATABASE_SSL_CA they're encrypted but not verified.
 */
function sslConfig(url: ParsedDatabaseUrl, caEnv: string | undefined): PoolConfig["ssl"] {
  const mode = url.params.get("sslmode");
  const ca = caEnv?.replace(/\\n/g, "\n");
  if (mode === "disable") return false;
  if (ca) return { ca, rejectUnauthorized: true };
  if (mode === "verify-full" || mode === "verify-ca") return { rejectUnauthorized: true };
  if (isSupabaseHost(url.host) || mode === "require" || mode === "prefer" || mode === "no-verify") {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

export function pgPoolConfig(raw: string, opts: { serverless: boolean; env?: Record<string, string | undefined> }): PoolConfig {
  const env = opts.env ?? process.env;
  const url = parseDatabaseUrl(raw);
  validate(url);
  const timeout = Number(env.DATABASE_CONNECT_TIMEOUT_MS) || (opts.serverless ? 5000 : 10000);
  // Discrete fields, not connectionString: pg lets URL params like sslmode override the ssl option.
  return {
    host: url.host,
    port: url.port,
    user: url.user,
    password: url.password,
    database: url.database,
    ssl: sslConfig(url, env.DATABASE_SSL_CA),
    max: opts.serverless ? 2 : 5,
    connectionTimeoutMillis: timeout,
    idleTimeoutMillis: opts.serverless ? 10_000 : 30_000,
    keepAlive: true,
  };
}

/** One-line, non-secret explanation of a connection or migration failure. */
export function describeDbError(err: unknown): string {
  // Drizzle wraps driver errors as "Failed query: <sql>" with the pg error as `cause`.
  while (err instanceof Error && err.cause && /^Failed query/.test(err.message)) err = err.cause;
  const e = (err ?? {}) as { code?: string; message?: string; name?: string };
  const msg = String(e.message ?? err).split("\n")[0]!.slice(0, 200);
  if (err instanceof DatabaseConfigError) return msg;
  switch (e.code) {
    case "ENOTFOUND":
    case "EAI_AGAIN":
      return "host not found; check the host in DATABASE_URL";
    case "ECONNREFUSED":
      return "connection refused; check the host and port";
    case "ENETUNREACH":
    case "EHOSTUNREACH":
      return "network unreachable; Supabase direct connections (db.<ref>.supabase.co) are IPv6-only, use the pooler";
    case "ETIMEDOUT":
      return "connection timed out; check the host, port and network";
    case "28P01":
      return "password authentication failed; check the database password (reset it in Supabase under Database settings if unsure)";
    case "3D000":
      return "database does not exist; check the database name after the last /";
  }
  if (/tenant(\/| or )user .*not found|tenant or user not found/i.test(msg)) {
    return "Supabase pooler: tenant/user not found; the username must be postgres.<project-ref> and the host (aws-0-… or aws-1-…) must match the dashboard's Connect string exactly";
  }
  if (/timeout/i.test(msg)) return `connection timed out (${msg}); raise DATABASE_CONNECT_TIMEOUT_MS or check the network`;
  if (/certificate|self[- ]signed/i.test(msg)) {
    return `TLS verification failed (${msg}); use sslmode=require or set DATABASE_SSL_CA to the Supabase root CA`;
  }
  if (/ssl/i.test(msg)) return `SSL negotiation failed (${msg})`;
  if (e.code && /^[0-9A-Z]{5}$/.test(e.code)) return `SQL error ${e.code}: ${msg}`;
  return `${e.code ?? e.name ?? "Error"}: ${msg}`;
}
