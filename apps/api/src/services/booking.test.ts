import { describe, it, expect, beforeAll, afterAll } from "vitest";
import "../config.js";
import {
  db,
  users,
  farmerProfiles,
  serviceAreas,
  areaPincodes,
  centres,
  centreAreaMap,
  procurementWindows,
  slots,
  bookings,
} from "@kisan/db";
import { eq, inArray } from "drizzle-orm";
import { bookSlot, cancelBooking, BookingError } from "./booking.js";

const TAG = `test-${Date.now()}`;
let areaId: string;
let centreId: string;
let windowId: string;
let slotId: string;
const farmerIds: string[] = [];

beforeAll(async () => {
  [{ id: areaId }] = await db
    .insert(serviceAreas)
    .values({ code: `${TAG}-AREA`, state: "Test", district: "Test", subDistrict: "Test" })
    .returning({ id: serviceAreas.id });
  await db.insert(areaPincodes).values({ serviceAreaId: areaId, pincode: "999999" });
  [{ id: centreId }] = await db
    .insert(centres)
    .values({ name: `${TAG}-Centre`, address: "x", pincode: "999999", district: "Test", state: "Test", commodities: ["Rice"], status: "active" })
    .returning({ id: centres.id });
  await db.insert(centreAreaMap).values({ centreId, serviceAreaId: areaId, priority: 1 });
  [{ id: windowId }] = await db
    .insert(procurementWindows)
    .values({ commodity: "Rice", season: "Test", year: 2026, startDate: "2026-01-01", endDate: "2026-12-31", status: "open" })
    .returning({ id: procurementWindows.id });
  [{ id: slotId }] = await db
    .insert(slots)
    .values({ centreId, procurementWindowId: windowId, slotDate: "2026-06-01", startTime: "10:00", endTime: "13:00", capacity: 2, bookedCount: 0, status: "open" })
    .returning({ id: slots.id });

  for (let i = 0; i < 5; i++) {
    const [u] = await db
      .insert(users)
      .values({ email: `${TAG}-f${i}@test.local`, role: "farmer", language: "en", emailVerifiedAt: new Date() })
      .returning();
    await db.insert(farmerProfiles).values({
      userId: u.id, fullName: `F${i}`, addressLine1: "x", district: "Test", state: "Test", pincode: "999999", serviceAreaId: areaId, verificationStatus: "verified",
    });
    farmerIds.push(u.id);
  }
});

afterAll(async () => {
  await db.delete(users).where(inArray(users.id, farmerIds));
  await db.delete(procurementWindows).where(eq(procurementWindows.id, windowId));
  await db.delete(centres).where(eq(centres.id, centreId));
  await db.delete(serviceAreas).where(eq(serviceAreas.id, areaId));
});

describe("bookSlot", () => {
  it("never overbooks a slot under concurrent load", async () => {
    const results = await Promise.allSettled(farmerIds.map((id) => bookSlot(id, slotId)));
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected");
    expect(ok).toBe(2); // capacity
    for (const f of failed) {
      expect((f as PromiseRejectedResult).reason).toBeInstanceOf(BookingError);
    }
    const [slot] = await db.select().from(slots).where(eq(slots.id, slotId));
    expect(slot.bookedCount).toBe(2);
    expect(slot.status).toBe("full");
  });

  it("rejects a second booking in the same procurement window", async () => {
    const [u] = await db
      .insert(users)
      .values({ email: `${TAG}-dup@test.local`, role: "farmer", language: "en", emailVerifiedAt: new Date() })
      .returning();
    await db.insert(farmerProfiles).values({
      userId: u.id, fullName: "Dup", addressLine1: "x", district: "Test", state: "Test", pincode: "999999", serviceAreaId: areaId, verificationStatus: "verified",
    });
    farmerIds.push(u.id);

    const [slot2] = await db
      .insert(slots)
      .values({ centreId, procurementWindowId: windowId, slotDate: "2026-06-02", startTime: "10:00", endTime: "13:00", capacity: 10, status: "open" })
      .returning();
    const [slot3] = await db
      .insert(slots)
      .values({ centreId, procurementWindowId: windowId, slotDate: "2026-06-03", startTime: "10:00", endTime: "13:00", capacity: 10, status: "open" })
      .returning();

    await bookSlot(u.id, slot2.id);
    await expect(bookSlot(u.id, slot3.id)).rejects.toMatchObject({ code: "DuplicateWindowBooking" });
  });
});
