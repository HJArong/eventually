import { describe, expect, it } from "vitest";
import { DatabaseConfigError, describeDbError, parseDatabaseUrl, pgPoolConfig } from "@/lib/db/connection";

const POOLER = "aws-0-ap-northeast-1.pooler.supabase.com";

describe("parseDatabaseUrl", () => {
  it("parses a Supabase transaction pooler string", () => {
    const u = parseDatabaseUrl(`postgresql://postgres.abcdefghijklmnop:s3cret@${POOLER}:6543/postgres`);
    expect(u).toMatchObject({ user: "postgres.abcdefghijklmnop", password: "s3cret", host: POOLER, port: 6543, database: "postgres" });
  });

  it("accepts passwords that were not URL-encoded", () => {
    const u = parseDatabaseUrl(`postgresql://postgres.ref:p@ss#w/rd?x:y%z@${POOLER}:6543/postgres`);
    expect(u.password).toBe("p@ss#w/rd?x:y%z");
    expect(u.host).toBe(POOLER);
  });

  it("decodes URL-encoded passwords", () => {
    expect(parseDatabaseUrl(`postgres://u:p%40ss%23@h:5432/db`).password).toBe("p@ss#");
  });

  it("reads query params and defaults", () => {
    const u = parseDatabaseUrl("postgres://u:p@ep-x.neon.tech/neondb?sslmode=require&channel_binding=require");
    expect(u.port).toBe(5432);
    expect(u.params.get("sslmode")).toBe("require");
  });

  it("rejects non-postgres URLs", () => {
    expect(() => parseDatabaseUrl("mysql://u:p@h/db")).toThrow(DatabaseConfigError);
  });
});

describe("pgPoolConfig", () => {
  const opts = { serverless: true, env: {} };

  it("encrypts Supabase connections without relying on Node's CA store", () => {
    const c = pgPoolConfig(`postgresql://postgres.ref:pw@${POOLER}:6543/postgres`, opts);
    expect(c.ssl).toEqual({ rejectUnauthorized: false });
    expect(c.connectionTimeoutMillis).toBe(5000);
    expect(c).not.toHaveProperty("connectionString");
  });

  it("verifies with DATABASE_SSL_CA when given", () => {
    const c = pgPoolConfig(`postgresql://postgres.ref:pw@${POOLER}:6543/postgres`, {
      serverless: true,
      env: { DATABASE_SSL_CA: "-----BEGIN CERTIFICATE-----\\nabc\\n-----END CERTIFICATE-----" },
    });
    expect(c.ssl).toEqual({ ca: "-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----", rejectUnauthorized: true });
  });

  it("follows sslmode elsewhere", () => {
    expect(pgPoolConfig("postgres://u:p@ep-x.neon.tech/db?sslmode=require", opts).ssl).toEqual({ rejectUnauthorized: false });
    expect(pgPoolConfig("postgres://u:p@h/db?sslmode=verify-full", opts).ssl).toEqual({ rejectUnauthorized: true });
    expect(pgPoolConfig("postgres://u:p@localhost/db", opts).ssl).toBeUndefined();
    expect(pgPoolConfig(`postgresql://postgres.ref:pw@${POOLER}:5432/postgres?sslmode=disable`, opts).ssl).toBe(false);
  });

  it("explains a pooler username without the project ref", () => {
    expect(() => pgPoolConfig(`postgresql://postgres:pw@${POOLER}:6543/postgres`, opts)).toThrow(/postgres\.<project-ref>/);
  });

  it("catches the [YOUR-PASSWORD] placeholder", () => {
    expect(() => pgPoolConfig(`postgresql://postgres.ref:[YOUR-PASSWORD]@${POOLER}:6543/postgres`, opts)).toThrow(/placeholder/);
    expect(() => pgPoolConfig(`postgresql://postgres.ref:[hunter2]@${POOLER}:6543/postgres`, opts)).toThrow(/without brackets/);
  });
});

describe("describeDbError", () => {
  it("maps common failures to short reasons", () => {
    expect(describeDbError(Object.assign(new Error("password authentication failed for user x"), { code: "28P01" }))).toMatch(/password/);
    expect(describeDbError(new Error("Tenant or user not found"))).toMatch(/postgres\.<project-ref>/);
    const supavisor = Object.assign(new Error("(ENOTFOUND) tenant/user postgres.abc not found"), { code: "XX000" });
    expect(describeDbError(supavisor)).toMatch(/^Supabase pooler: tenant\/user not found/);
    expect(describeDbError(new Error("timeout expired"))).toMatch(/timed out/);
    expect(describeDbError(new Error("self-signed certificate in certificate chain"))).toMatch(/TLS/);
    expect(describeDbError(Object.assign(new Error("getaddrinfo ENOTFOUND h"), { code: "ENOTFOUND" }))).toMatch(/host not found/);
    const pgErr = Object.assign(new Error("password authentication failed"), { code: "28P01" });
    expect(describeDbError(new Error("Failed query: select 1", { cause: pgErr }))).toMatch(/^password authentication failed/);
    expect(describeDbError(Object.assign(new Error('relation "x" already exists'), { code: "42P07" }))).toBe(
      'SQL error 42P07: relation "x" already exists',
    );
  });
});
