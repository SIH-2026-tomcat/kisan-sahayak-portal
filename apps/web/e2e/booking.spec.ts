import { test, expect, request as pwRequest } from "@playwright/test";

/**
 * End-to-end booking flow driven through the web BFF + Neon Auth.
 * A single APIRequestContext keeps the session cookie across calls.
 */
test("farmer registers, completes profile and books a slot", async ({ baseURL }) => {
  const email = `e2e.${Date.now()}@hawkvance.in`;
  const password = "E2ePass123456";
  const ctx = await pwRequest.newContext({ baseURL });

  const signup = await ctx.post("/api/auth/sign-up/email", {
    data: { email, password, name: "E2E Farmer" },
    headers: { origin: baseURL! },
  });
  expect(signup.ok(), await signup.text()).toBeTruthy();

  const me = await (await ctx.get("/api/bff/auth/me")).json();
  expect(me.user.email).toBe(email);

  const prof = await ctx.post("/api/bff/farmers/profile", {
    data: {
      fullName: "E2E Farmer",
      addressLine1: "Village E2E",
      district: "Kendrapara",
      state: "Odisha",
      pincode: "754211",
      mobile: `98${Math.floor(10000000 + Math.random() * 89999999)}`,
      consent: true,
    },
  });
  expect(prof.ok(), await prof.text()).toBeTruthy();
  const { serviceAreaId } = await prof.json();

  const slots = await (await ctx.get(`/api/bff/slots?serviceAreaId=${serviceAreaId}&tab=open`)).json();
  const slot = slots.items.find((s: any) => s.remaining > 0);
  expect(slot).toBeTruthy();

  const booked = await ctx.post(`/api/bff/slots/${slot.id}/book`);
  expect(booked.ok(), await booked.text()).toBeTruthy();
  const { booking } = await booked.json();
  expect(booking.bookingCode).toMatch(/^KS-/);
  expect(booking.tokenNumber).toBeGreaterThan(0);

  const slot2 = slots.items.find((s: any) => s.id !== slot.id && s.remaining > 0);
  if (slot2) {
    const dup = await ctx.post(`/api/bff/slots/${slot2.id}/book`);
    expect(dup.status()).toBe(409);
  }
  await ctx.dispose();
});
