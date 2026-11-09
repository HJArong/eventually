import { expect, test } from "@playwright/test";
import { signInAs } from "./helpers";

const PLANNER_PAGES = [
  "/home",
  "/search?q=lechon",
  "/packages",
  "/packages/debut-starter",
  "/vendors/lechon-ni-inday",
  "/request/lechon-ni-inday",
  "/feed",
  "/event",
  "/inbox",
  "/saved",
];
const VENDOR_PAGES = ["/vendor", "/vendor/requests", "/vendor/inbox", "/vendor/feed", "/vendor/posts/new", "/vendor/services", "/vendor/shop"];

for (const [who, pages] of [
  ["planner", PLANNER_PAGES],
  ["vendor", VENDOR_PAGES],
] as const) {
  test(`${who} pages render`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await signInAs(page, who);
    for (const path of pages) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBeLessThan(400);
      await expect(page.locator("main").first()).toBeVisible();
      const overflowing = await page.evaluate(() => {
        const clipped = (el: Element | null): boolean => {
          for (let n = el?.parentElement; n; n = n.parentElement) {
            const o = getComputedStyle(n).overflowX;
            if (o === "auto" || o === "scroll" || o === "hidden") return true;
          }
          return false;
        };
        return [...document.querySelectorAll("main *")]
          .filter((el) => el.getBoundingClientRect().right > innerWidth + 1 && !clipped(el))
          .map((el) => `${el.tagName}.${String(el.className).slice(0, 60)}`)
          .slice(0, 3);
      });
      expect(overflowing, `${path} overflows the mobile viewport`).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/vendor");
  await expect(page).toHaveURL(/\/sign-in/);
});
