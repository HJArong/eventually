import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    ...devices["iPhone 13"],
    browserName: "chromium",
    baseURL,
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: process.env.E2E_VIDEO ? { mode: "on", size: { width: 390, height: 844 } } : "off",
    launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : undefined,
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "pnpm dev", url: `${baseURL}/sign-in`, reuseExistingServer: true, timeout: 180_000 },
});
