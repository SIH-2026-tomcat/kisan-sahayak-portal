import { test, expect, request } from "@playwright/test";

const API_URL = process.env.PUBLIC_API_URL || "http://localhost:3001";

async function uniqueEmail() {
  return `con-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@hawkvance.in`;
}

async function createFarmer() {
  const api = await request.newContext({ baseURL: API_URL });
  const email = await uniqueEmail();
  const register = await api.post("/auth/register", {
    data: { email, password: "TestPass123", name: "Concurrency Farmer" },
  });
  expect(register.ok()).toBeTruthy();
  const { token } = (await register.json()) as { token: string };

  const profile = await api.post("/farmers/profile", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      fullName: "Concurrency Farmer",
      addressLine1: "Bhatapara",
      district: "Kendrapara",
      state: "Odisha",
      pincode: "754211",
      mobile: `+91${Math.floor(1e9 + Math.random() * 9e9)}`,
      consent: true,
    },
  });
  expect(profile.ok()).toBeTruthy();
  return { token, api };
}

test.describe("booking concurrency", () => {
  test("parallel bookings must not exceed slot capacity", async () => {
    const slotsRes = await (await request.newContext({ baseURL: API_URL })).get(
      `/slots?serviceAreaId=59882d00-9c29-4ce5-be82-fe4436d0e180&status=open`
    );
    const { items } = (await slotsRes.json()) as { items: { id: string; capacity: number; bookedCount: number }[] };
    const slot = items.find((s) => s.capacity - s.bookedCount >= 3);
    if (!slot) throw new Error("No slot with enough capacity for concurrency test");

    const farmers: { token: string; api: any }[] = [];
    for (let i = 0; i < 3; i++) {
      farmers.push(await createFarmer());
      if (i < 2) await new Promise((resolve) => setTimeout(resolve, 150));
    }

    const attempts = await Promise.all(
      farmers.map((farmer) =>
        farmer.api.post(`/slots/${slot.id}/book`, {
          headers: { Authorization: `Bearer ${farmer.token}` },
        })
      )
    );

    const okCount = attempts.filter((r) => r.ok()).length;
    expect(okCount).toBe(3);

    const final = await (await request.newContext({ baseURL: API_URL })).get(
      `/slots?serviceAreaId=59882d00-9c29-4ce5-be82-fe4436d0e180&status=open`
    );
    const { items: after } = (await final.json()) as {
      items: { id: string; bookedCount: number }[];
    };
    const updated = after.find((s) => s.id === slot.id);
    expect(updated?.bookedCount).toBe(slot.bookedCount + okCount);
  });
});
