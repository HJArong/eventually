import { expect, test, type Page } from "@playwright/test";

async function magicLinkSignIn(page: Page, email: string) {
  await page.context().clearCookies();
  await page.goto("/sign-in");
  await page.getByPlaceholder("you@email.com").fill(email);
  await page.getByRole("button", { name: /Email me a magic link/ }).click();
  await page.getByRole("link", { name: "Open magic link" }).click();
  await page.waitForURL(/\/onboarding$/);
}

const samplePhoto = (page: Page, i: number) => page.locator("label:has(input[name=samplePhotos])").nth(i);

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

test("new planner: magic link → role → create event", async ({ page }) => {
  await magicLinkSignIn(page, `planner+${unique()}@example.com`);
  await page.getByLabel("Your first name").fill("Carmela");
  await page.getByText("I'm planning").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/onboarding\/planner/);

  await page.locator("label", { hasText: /^Christening$/ }).click();
  await page.getByLabel("Whose event?").fill("Lucas");
  await page.getByLabel("When?").fill("2027-06-12");
  await page.getByLabel("Guests").fill("60");
  await page.locator("label", { hasText: /^Mandaue$/ }).click();
  await page.locator("label", { hasText: "₱50–100k" }).click();
  await page.getByRole("button", { name: "Create my event" }).click();

  await page.waitForURL(/\/home/);
  await expect(page.getByText("Lucas' Christening").first()).toBeVisible();
  await page.goto("/event");
  await expect(page.getByText(/tasks? done|of \d+ booked/i).first()).toBeVisible();
});

test("new vendor: shop setup → services → post", async ({ page }) => {
  await magicLinkSignIn(page, `vendor+${unique()}@example.com`);
  await page.getByLabel("Your first name").fill("Rhea");
  await page.getByText("I'm a vendor").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/onboarding\/vendor/);

  const shop = `Rhea's Cakes ${unique()}`;
  await page.getByLabel("Business name").fill(shop);
  await page.locator("label", { hasText: /^Cakes$/ }).click();
  await page.locator("label", { hasText: /^Cebu City$/ }).click();
  await page.locator("label", { hasText: /^Talisay$/ }).click();
  await page.getByLabel("Starting price ₱").fill("3500");
  for (const i of [0, 1, 2]) await samplePhoto(page, i).click();
  await expect(page.getByText("3 selected")).toBeVisible();
  await page.getByRole("button", { name: "Next: add services" }).click();

  await page.waitForURL(/\/vendor\/services\?onboarding=1/);
  await page.getByRole("button", { name: "Add a service" }).click();
  await page.getByLabel("Service name").fill("2-tier debut cake");
  await page.getByLabel("Price (₱)").fill("4800");
  await page.getByRole("button", { name: "Save service" }).click();
  await expect(page.getByText("2-tier debut cake")).toBeVisible();
  await page.getByRole("link", { name: "Go to dashboard" }).click();
  await page.waitForURL(/\/vendor$/);
  await expect(page.getByRole("heading", { name: shop })).toBeVisible();

  await page.goto("/vendor/posts/new");
  await samplePhoto(page, 0).click();
  await page.getByLabel("Caption").fill("Fresh from the oven for a Talisay debut!");
  await page.getByRole("button", { name: "Publish to feed" }).click();
  await page.waitForURL(/\/vendor\/feed\?posted=1/);
  await expect(page.getByText("Fresh from the oven")).toBeVisible();
});
