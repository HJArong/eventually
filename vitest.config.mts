import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": import.meta.dirname } },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    env: { AUTH_SECRET: "test-secret-test-secret-test-secret", DEMO_MODE: "true" },
  },
});
