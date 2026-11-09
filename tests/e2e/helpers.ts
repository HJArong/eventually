import type { Page } from "@playwright/test";

export async function signInAs(page: Page, who: "planner" | "vendor") {
  await page.context().clearCookies();
  await page.goto("/sign-in");
  await page.getByRole("button", { name: new RegExp(`Sign in as demo ${who}`) }).click();
  await page.waitForURL(who === "planner" ? /\/home/ : /\/vendor$/);
}

/** Reseeds the demo world via the planner settings page, leaving the browser signed out. */
export async function resetDemo(page: Page) {
  await signInAs(page, "planner");
  await page.goto("/saved");
  await page.getByRole("button", { name: /Reset demo data/ }).click();
  await page.waitForURL(/\/sign-in/);
}
