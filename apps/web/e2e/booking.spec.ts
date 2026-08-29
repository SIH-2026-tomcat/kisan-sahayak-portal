import { test, expect, request } from "@playwright/test";

const API_URL = process.env.PUBLIC_API_URL || "http://localhost:3001";

async function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@hawkvance.in`;
}

test.describe("end-to-end booking flow", () => {
  test("registers a farmer, creates a profile, books a slot, and prevents a duplicate", async ({ page }) => {
    const api = await request.newContext({ baseURL: API_URL });

    const email = await uniqueEmail();
    const register = await api.post("/auth/register", {
      data: { email, password: "TestPass123", name: "Playwright Farmer" },
    });
    expect(register.ok()).toBeTruthy();
    const { token } = (await register.json()) as { token: string };

    const profile = await api.post("/farmers/profile", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        fullName: "Playwright Farmer",
        addressLine1: "Bhatapara",
        district: "Kendrapara",
        state: "Odisha",
        pincode: "754211",
        mobile: `+91${Math.floor(1e9 + Math.random() * 9e9)}`,
        consent: true,
      },
    });
    expect(profile.ok()).toBeTruthy();

    const slotsRes = await api.get(`/slots?serviceAreaId=59882d00-9c29-4ce5-be82-fe4436d0e180&status=open`);
    expect(slotsRes.ok()).toBeTruthy();
    const { items } = (await slotsRes.json()) as { items: { id: string }[] };
    expect(items.length).toBeGreaterThan(0);

    const slotId = items[0].id;
    const book = await api.post(`/slots/${slotId}/book`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(book.ok()).toBeTruthy();
    const { booking } = (await book.json()) as { booking: { bookingCode: string; tokenNumber: number } };
    expect(booking.bookingCode).toMatch(/^KS-/);
    expect(booking.tokenNumber).toBeGreaterThan(0);

    const duplicate = await api.post(`/slots/${slotId}/book`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(duplicate.status()).toBe(409);

    await page.goto("/");
    await expect(page.locator("text=Book this slot").first()).toBeVisible();
  });
});
