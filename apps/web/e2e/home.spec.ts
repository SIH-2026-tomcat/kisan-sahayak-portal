import { test, expect } from "@playwright/test";

test.describe("public site", () => {
  test("home shows hero and primary actions", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Kisan Sahayak Portal" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Register as a Farmer/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Login", exact: true }).first()).toBeVisible();
  });

  test("no horizontal overflow at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    for (const path of ["/", "/about", "/login", "/register"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflow, `overflow on ${path}`).toBe(false);
    }
  });

  test("language selector switches interface strings", async ({ page }) => {
    await page.goto("/");
    await page.locator("select").first().selectOption("hi");
    await expect(page.getByRole("link", { name: /किसान के रूप में पंजीकरण करें/ })).toBeVisible();
  });

  test("protected routes redirect to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin-login/);
  });
});
