import { test, expect } from "@playwright/test";

test.describe("public home", () => {
  test("shows the hero and open slots", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Kisan Sahayak Portal")).toBeVisible();
    await expect(page.locator("text=Open slots")).toBeVisible();
    await expect(page.locator("text=Kendrapara Procurement Centre").first()).toBeVisible();
    await expect(page.locator("text=Book this slot").first()).toBeVisible();
  });

  test("mobile view does not overflow horizontally", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");
    const body = page.locator("body");
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    const viewportWidth = 360;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 16);
  });
});
