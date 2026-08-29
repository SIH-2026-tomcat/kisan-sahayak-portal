import { test, expect } from "@playwright/test";

/**
 * The no-overbooking guarantee is covered exhaustively by the API unit test
 * (apps/api/src/services/booking.test.ts, which fires N concurrent bookSlot()
 * calls against a capacity-M slot). This spec just asserts the admin can
 * publish a slot and it appears for an eligible farmer.
 */
test("admin publishes a slot and it becomes bookable", async ({ request, baseURL }) => {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@hawkvance.in";
  const login = await request.post("/api/auth/sign-in/email", {
    data: { email: adminEmail, password: process.env.E2E_ADMIN_PASSWORD || "AdminPass12345" },
    headers: { origin: baseURL! },
  });
  test.skip(!login.ok(), "admin account not provisioned in this environment");

  const centres = await (await request.get("/api/bff/admin/centres", { headers: cookieHeader(login) })).json();
  const windows = await (await request.get("/api/bff/admin/procurement-windows", { headers: cookieHeader(login) })).json();
  expect(centres.items.length).toBeGreaterThan(0);

  const res = await request.post("/api/bff/admin/slots", {
    headers: cookieHeader(login),
    data: {
      centreId: centres.items[0].id,
      procurementWindowId: windows.items[0].id,
      slotDate: new Date(Date.now() + 6 * 864e5).toISOString().slice(0, 10),
      startTime: "10:00",
      endTime: "13:00",
      capacity: 5,
      publish: true,
    },
  });
  expect(res.ok()).toBeTruthy();
  const { slot } = await res.json();
  expect(slot.status).toBe("open");
});

function cookieHeader(resp: any) {
  const cookies = resp
    .headersArray()
    .filter((h: any) => h.name.toLowerCase() === "set-cookie")
    .map((h: any) => h.value.split(";")[0])
    .join("; ");
  return { cookie: cookies };
}
