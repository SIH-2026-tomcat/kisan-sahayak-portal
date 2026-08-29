import "../src/load-env.js";

import { sql } from "drizzle-orm";
import { db } from "../src/client.js";
import {
  serviceAreas,
  areaPincodes,
  centres,
  centreAreaMap,
  procurementWindows,
  slots,
  users,
  farmerProfiles,
  bookings,
  announcements,
  notifications,
} from "../src/schema.js";

const RESET = process.env.SEED_RESET === "true";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@hawkvance.in";

function isoDate(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

function bookingCode(n: number) {
  return `KS-${String(n).padStart(6, "0")}`;
}

async function seed() {
  const existing = await db.select({ n: sql<number>`count(*)` }).from(serviceAreas);
  if (Number(existing[0].n) > 0 && !RESET) {
    console.log("Seed data already present. Re-run with SEED_RESET=true to wipe and reseed.");
    process.exit(0);
  }

  if (RESET) {
    console.log("SEED_RESET=true -> truncating all tables");
    await db.execute(sql`TRUNCATE TABLE
      audit_logs, outbound_messages, notifications, announcements, bookings,
      slots, procurement_windows, centre_area_map, centres, area_pincodes,
      farmer_profiles, service_areas, users RESTART IDENTITY CASCADE`);
  }

  console.log("Seeding demo data...");

  // --- Service areas ---
  const [kendrapara, jagatsinghpur, cuttackSadar] = await db
    .insert(serviceAreas)
    .values([
      { code: "OD-KDP-01", state: "Odisha", district: "Kendrapara", subDistrict: "Kendrapara" },
      { code: "OD-JGP-01", state: "Odisha", district: "Jagatsinghpur", subDistrict: "Jagatsinghpur" },
      { code: "OD-CTC-01", state: "Odisha", district: "Cuttack", subDistrict: "Cuttack Sadar" },
    ])
    .returning();

  await db.insert(areaPincodes).values([
    ...["754211", "754212", "754213", "754250"].map((pincode) => ({ serviceAreaId: kendrapara.id, pincode })),
    ...["754103", "754104", "754105"].map((pincode) => ({ serviceAreaId: jagatsinghpur.id, pincode })),
    ...["753001", "753002", "753008"].map((pincode) => ({ serviceAreaId: cuttackSadar.id, pincode })),
  ]);

  // --- Centres (Cuttack Sadar deliberately has NO centre, to demo "no coverage") ---
  const [kendraparaCentre, patamundaiCentre, jagatsinghpurCentre] = await db
    .insert(centres)
    .values([
      {
        name: "Kendrapara Procurement Centre",
        address: "Near Bus Stand, College Road, Kendrapara, Odisha 754211",
        pincode: "754211",
        district: "Kendrapara",
        state: "Odisha",
        latitude: "20.50085",
        longitude: "86.42258",
        contactPhone: "1800-11-4000",
        openingHours: "Mon-Sat, 10:00 - 17:00",
        commodities: ["Rice", "Paddy"],
        status: "active",
      },
      {
        name: "Patamundai Mandi Yard",
        address: "NH-53, Patamundai, Kendrapara, Odisha 754213",
        pincode: "754213",
        district: "Kendrapara",
        state: "Odisha",
        latitude: "20.57800",
        longitude: "86.55600",
        contactPhone: "1800-11-4001",
        openingHours: "Mon-Sat, 09:30 - 16:30",
        commodities: ["Rice"],
        status: "active",
      },
      {
        name: "Jagatsinghpur Procurement Centre",
        address: "Marketing Yard, Jagatsinghpur, Odisha 754103",
        pincode: "754103",
        district: "Jagatsinghpur",
        state: "Odisha",
        latitude: "20.25500",
        longitude: "86.17100",
        contactPhone: "1800-11-4002",
        openingHours: "Mon-Sat, 10:00 - 17:00",
        commodities: ["Rice"],
        status: "active",
      },
    ])
    .returning();

  await db.insert(centreAreaMap).values([
    { centreId: kendraparaCentre.id, serviceAreaId: kendrapara.id, priority: 1 },
    { centreId: patamundaiCentre.id, serviceAreaId: kendrapara.id, priority: 2 },
    { centreId: jagatsinghpurCentre.id, serviceAreaId: jagatsinghpur.id, priority: 1 },
  ]);

  // --- Procurement window ---
  const [kharif] = await db
    .insert(procurementWindows)
    .values({
      commodity: "Rice",
      season: "Kharif",
      year: 2026,
      startDate: isoDate(-3),
      endDate: isoDate(35),
      status: "open",
    })
    .returning();

  // --- Slots: open (with headroom), near-full, upcoming (scheduled), closed ---
  const [openSlotA, nearFullSlot, openSlotB, upcomingSlot, closedSlot, jgpSlot] = await db
    .insert(slots)
    .values([
      { centreId: kendraparaCentre.id, procurementWindowId: kharif.id, slotDate: isoDate(1), startTime: "10:00", endTime: "13:00", capacity: 100, bookedCount: 24, status: "open" },
      { centreId: kendraparaCentre.id, procurementWindowId: kharif.id, slotDate: isoDate(1), startTime: "14:00", endTime: "17:00", capacity: 30, bookedCount: 29, status: "open" },
      { centreId: patamundaiCentre.id, procurementWindowId: kharif.id, slotDate: isoDate(2), startTime: "09:30", endTime: "12:30", capacity: 60, bookedCount: 5, status: "open" },
      { centreId: kendraparaCentre.id, procurementWindowId: kharif.id, slotDate: isoDate(5), startTime: "10:00", endTime: "13:00", capacity: 100, bookedCount: 0, status: "scheduled", publishAt: new Date(Date.now() + 2 * 864e5) },
      { centreId: kendraparaCentre.id, procurementWindowId: kharif.id, slotDate: isoDate(-2), startTime: "10:00", endTime: "13:00", capacity: 80, bookedCount: 80, status: "closed" },
      { centreId: jagatsinghpurCentre.id, procurementWindowId: kharif.id, slotDate: isoDate(2), startTime: "10:00", endTime: "13:00", capacity: 50, bookedCount: 3, status: "open" },
    ])
    .returning();

  // --- Admin user (super_admin) ---
  await db.insert(users).values({
    email: ADMIN_EMAIL,
    role: "super_admin",
    language: "en",
    emailVerifiedAt: new Date(),
  });

  // --- Farmers ---
  const farmerRows = await db
    .insert(users)
    .values([
      { email: "farmer.demo@hawkvance.in", mobile: "+919876543210", role: "farmer", language: "en", emailVerifiedAt: new Date() },
      { email: "sita.rout@example.in", mobile: "+919812345678", role: "farmer", language: "en", emailVerifiedAt: new Date() },
      { email: "gopal.nayak@example.in", mobile: "+919900112233", role: "farmer", language: "hi", emailVerifiedAt: new Date() },
      { email: "laxmi.behera@example.in", mobile: "+919700443322", role: "farmer", language: "en", emailVerifiedAt: new Date() },
    ])
    .returning();
  const [demoFarmer, sita, gopal, laxmi] = farmerRows;

  await db.insert(farmerProfiles).values([
    { userId: demoFarmer.id, fullName: "Ramesh Prachan", addressLine1: "Village Bhatapara", village: "Bhatapara", district: "Kendrapara", state: "Odisha", pincode: "754211", serviceAreaId: kendrapara.id, aadhaarLast4: "1234", verificationStatus: "verified", consentGivenAt: new Date() },
    { userId: sita.id, fullName: "Sita Rout", addressLine1: "Village Aul", village: "Aul", district: "Kendrapara", state: "Odisha", pincode: "754212", serviceAreaId: kendrapara.id, aadhaarLast4: "5678", verificationStatus: "verified", consentGivenAt: new Date() },
    { userId: gopal.id, fullName: "Gopal Nayak", addressLine1: "Village Balikuda", village: "Balikuda", district: "Jagatsinghpur", state: "Odisha", pincode: "754103", serviceAreaId: jagatsinghpur.id, aadhaarLast4: "9012", verificationStatus: "pending" },
    { userId: laxmi.id, fullName: "Laxmi Behera", addressLine1: "Village Marshaghai", village: "Marshaghai", district: "Kendrapara", state: "Odisha", pincode: "754213", serviceAreaId: kendrapara.id, aadhaarLast4: "3456", verificationStatus: "verified", consentGivenAt: new Date() },
  ]);

  // --- A couple of existing bookings so dashboards aren't empty ---
  await db.insert(bookings).values([
    { farmerId: sita.id, slotId: openSlotA.id, procurementWindowId: kharif.id, bookingCode: bookingCode(1), tokenNumber: 12, status: "confirmed" },
    { farmerId: laxmi.id, slotId: openSlotB.id, procurementWindowId: kharif.id, bookingCode: bookingCode(2), tokenNumber: 3, status: "procured" },
  ]);

  await db.insert(notifications).values([
    { userId: sita.id, type: "booking_confirmed", title: "Booking confirmed", body: `Your booking ${bookingCode(1)} at Kendrapara Procurement Centre is confirmed.`, metadata: { bookingCode: bookingCode(1) } },
    { userId: laxmi.id, type: "procurement_update", title: "Procurement recorded", body: "Your produce has been received at Patamundai Mandi Yard.", metadata: {} },
  ]);

  // --- Announcement ---
  await db.insert(announcements).values({
    title: "New procurement slots released for Kendrapara",
    message: "New rice procurement slots are open for this week. Please book only a centre shown for your service area and arrive within your selected time window.",
    audienceType: "service_area",
    serviceAreaId: kendrapara.id,
    sendChannels: ["in_app", "email"],
    sentAt: new Date(),
  });

  console.log("Demo data seeded:");
  console.log("  service areas: Kendrapara, Jagatsinghpur, Cuttack Sadar (no centre)");
  console.log("  centres: 3  | slots: 6 (open/near-full/upcoming/closed)");
  console.log(`  admin: ${ADMIN_EMAIL} (sign up in Neon Auth with this email to activate)`);
  console.log("  farmers: farmer.demo@hawkvance.in (+3 more)");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
