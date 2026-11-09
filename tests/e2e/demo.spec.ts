import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { resetDemo, signInAs } from "./helpers";

/**
 * The README demo script as an end-to-end test. Set SHOTS_DIR to save screenshots and
 * E2E_VIDEO=1 to record (pauses are added so the recording is watchable).
 */
const SHOTS = process.env.SHOTS_DIR;
const PACE = process.env.E2E_VIDEO ? 900 : 0;

async function beat(page: Page, ms = PACE) {
  if (ms) await page.waitForTimeout(ms);
}

async function shot(page: Page, name: string) {
  if (!SHOTS) return;
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
}

async function scrollIntoViewSlowly(page: Page, selector: ReturnType<Page["getByText"]>) {
  await selector.first().scrollIntoViewIfNeeded();
  await beat(page, PACE / 2);
}

test("demo script: planner books, vendor quotes", async ({ page, browser }, testInfo) => {
  test.setTimeout(300_000);
  const setup = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
  await resetDemo(await setup.newPage());
  await setup.close();

  await page.goto("/");
  await shot(page, "01-landing");
  await beat(page);
  await page.goto("/sign-in");
  await scrollIntoViewSlowly(page, page.getByText("One-click demo"));
  await shot(page, "02-sign-in");
  await signInAs(page, "planner");

  // Home + event dashboard
  await expect(page.getByText("Sofia’s 18th Debut").or(page.getByText("Sofia's 18th Debut")).first()).toBeVisible();
  await shot(page, "03-home");
  await beat(page);
  await page.goto("/event");
  await shot(page, "04-event-dashboard");
  await beat(page);

  // Package → request quotes from every vendor in it
  await page.goto("/packages");
  await shot(page, "05-packages");
  await page.getByRole("link", { name: /Debut Starter/ }).first().click();
  await page.waitForURL(/\/packages\/debut-starter/);
  await beat(page);
  await shot(page, "06-package-builder");
  const hostRow = page.locator("li", { hasText: "Host Migs" });
  await hostRow.getByRole("button", { name: "Swap" }).click();
  await beat(page);
  await hostRow.locator("button.rounded-2xl").nth(1).click();
  await expect(page.locator("li", { hasText: "swapped" })).toBeVisible();
  await beat(page);
  await page.getByRole("button", { name: /Request quotes from all 4/ }).click();
  await page.waitForURL(/\/inbox/);
  await shot(page, "07-inbox-requests-sent");

  // Hero: search lechon, request two, get an auto-quote
  await page.goto("/search?q=lechon");
  await beat(page);
  await shot(page, "08-search-lechon");
  await page.getByRole("link", { name: /Lechon ni Inday/ }).first().click();
  await page.waitForURL(/\/vendors\/lechon-ni-inday/);
  await beat(page);
  await shot(page, "09-vendor-profile");
  await page.goto("/request/lechon-ni-inday");
  const services = page.locator("button[aria-pressed]");
  for (const i of [0, 1]) {
    await expect(async () => {
      if ((await services.nth(i).getAttribute("aria-pressed")) !== "true") await services.nth(i).click();
      await expect(services.nth(i)).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
    }).toPass();
  }
  await expect(page.getByText(/Estimate at listed prices/)).toBeVisible();
  await beat(page);
  await shot(page, "10-request-form");
  await page.getByRole("button", { name: /Send request/ }).click();
  await page.waitForURL(/\/inbox\/[0-9a-f-]{36}/);
  await shot(page, "11-request-sent");

  const accept = page.getByRole("button", { name: /Accept & book/ });
  await expect(accept).toBeVisible({ timeout: 60_000 });
  await accept.scrollIntoViewIfNeeded();
  await beat(page);
  await shot(page, "12-quote-received");
  await accept.click();
  await page.waitForURL(/\/pay\//);
  await beat(page);
  await shot(page, "13-gcash-deposit");
  await page.getByRole("button", { name: /^Pay ₱/ }).click();
  await page.waitForURL(/booked=1/);
  await expect(page.getByText(/Booked|confirmed/i).first()).toBeVisible();
  await beat(page, PACE * 2);
  await shot(page, "14-booked");

  await page.goto("/event");
  await expect(page.getByText(/Booked/).first()).toBeVisible();
  await beat(page);
  await shot(page, "15-event-after-booking");
  const openTask = page.locator("button[aria-pressed=false]", { hasText: /\w/ }).first();
  await openTask.scrollIntoViewIfNeeded();
  const taskText = (await openTask.innerText()).trim().split("\n")[0]!;
  await openTask.click();
  await expect(page.locator("button[aria-pressed=true]", { hasText: taskText })).toBeVisible();
  await beat(page);

  // Feed: save a post, jump to the linked service
  await page.goto("/feed");
  await beat(page);
  await shot(page, "16-feed");
  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(page.getByRole("button", { name: "Unsave" }).first()).toBeVisible();
  await beat(page);
  const viewService = page.getByRole("link", { name: /View service/ }).first();
  await viewService.scrollIntoViewIfNeeded();
  await viewService.click();
  await page.waitForURL(/\/request\/.+service=/);
  await expect(page.locator("button[aria-pressed=true]")).toHaveCount(1);
  await beat(page);
  await shot(page, "17-request-from-feed");
  await page.getByRole("button", { name: /Send request/ }).click();
  await page.waitForURL(/\/inbox\/[0-9a-f-]{36}/);
  await beat(page);

  // Vendor side: dashboard → quote a request
  await page.context().clearCookies();
  await page.goto("/sign-in#demo");
  await scrollIntoViewSlowly(page, page.getByText("One-click demo"));
  await beat(page);
  await page.getByRole("button", { name: /Sign in as demo vendor/ }).click();
  await page.waitForURL(/\/vendor$/);
  await beat(page);
  await shot(page, "18-vendor-dashboard");
  await page.getByRole("link", { name: "Quote" }).first().click();
  await page.waitForURL(/\/vendor\/requests\/.+\/quote/);
  await beat(page);
  await shot(page, "19-vendor-quote-composer");
  await page.getByRole("button", { name: /Send quote/ }).click();
  await page.waitForURL(/\/vendor\/inbox\/.+quoted=1/);
  await beat(page);
  await shot(page, "20-vendor-quote-sent");

  await page.goto("/vendor/posts/new");
  await page.locator("label:has(input[name=samplePhotos])").first().click();
  await page.getByLabel("Caption").pressSequentially("Two lechon for Sofia's debut this March!", { delay: PACE ? 25 : 0 });
  await page.locator("label", { hasText: /^Debut$/ }).click();
  await shot(page, "21-vendor-new-post");
  await page.getByRole("button", { name: "Publish to feed" }).click();
  await page.waitForURL(/\/vendor\/feed\?posted=1/);
  await expect(page.getByText("Published!")).toBeVisible();
  await shot(page, "22-vendor-post-published");
  await beat(page, PACE * 2);
});
