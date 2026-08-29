import "../src/load-env";

import { db } from "../src/client";
import {
  serviceAreas,
  areaPincodes,
  centres,
  centreAreaMap,
  procurementWindows,
  slots,
  users,
  farmerProfiles,
  announcements,
} from "../src/schema";

async function seed() {
  console.log("Seeding demo data...");

  // Service area for Kendrapara district
  const [kendraparaArea] = await db
    .insert(serviceAreas)
    .values({
      code: "OD-KDP-01",
      state: "Odisha",
      district: "Kendrapara",
      subDistrict: "Kendrapara",
    })
    .returning();

  await db.insert(areaPincodes).values([
    { serviceAreaId: kendraparaArea.id, pincode: "754211" },
    { serviceAreaId: kendraparaArea.id, pincode: "754212" },
    { serviceAreaId: kendraparaArea.id, pincode: "754213" },
    { serviceAreaId: kendraparaArea.id, pincode: "754250" },
  ]);

  // Demo centre
  const [kendraparaCentre] = await db
    .insert(centres)
    .values({
      name: "Kendrapara Procurement Centre",
      address: "Near Bus Stand, Kendrapara, Odisha",
      pincode: "754211",
      district: "Kendrapara",
      state: "Odisha",
      latitude: "20.50000",
      longitude: "86.42000",
      contactPhone: "1800-11-4000",
      openingHours: "10:00 AM - 01:00 PM",
      commodities: ["Rice"],
      status: "active",
    })
    .returning();

  await db.insert(centreAreaMap).values({
    centreId: kendraparaCentre.id,
    serviceAreaId: kendraparaArea.id,
    priority: 1,
  });

  // Procurement window
  const [kharifWindow] = await db
    .insert(procurementWindows)
    .values({
      commodity: "Rice",
      season: "Kharif",
      year: 2026,
      startDate: "2026-08-29",
      endDate: "2026-09-30",
      status: "open",
    })
    .returning();

  // Open slots
  const today = new Date().toISOString().split("T")[0];
  await db.insert(slots).values([
    {
      centreId: kendraparaCentre.id,
      procurementWindowId: kharifWindow.id,
      slotDate: today,
      startTime: "10:00",
      endTime: "13:00",
      capacity: 100,
      bookedCount: 0,
      status: "open",
    },
    {
      centreId: kendraparaCentre.id,
      procurementWindowId: kharifWindow.id,
      slotDate: today,
      startTime: "14:00",
      endTime: "17:00",
      capacity: 80,
      bookedCount: 0,
      status: "open",
    },
  ]);

  // Demo farmer user
  const [demoFarmer] = await db
    .insert(users)
    .values([{
      email: "farmer.demo@hawkvance.in",
      mobile: "+919876543210",
      role: "farmer",
      language: "en",
      emailVerifiedAt: new Date(),
      mobileVerifiedAt: new Date(),
    }])
    .returning();

  await db.insert(farmerProfiles).values({
    userId: demoFarmer.id,
    fullName: "Ramesh Prachan",
    addressLine1: "Bhatapara",
    village: "Bhatapara",
    district: "Kendrapara",
    state: "Odisha",
    pincode: "754211",
    serviceAreaId: kendraparaArea.id,
    verificationStatus: "verified",
  });

  // Demo announcement
  await db.insert(announcements).values({
    title: "New slots released",
    message: "New rice procurement slots are open for 29 August. Please book only a centre shown for your service area.",
    audienceType: "service_area",
    serviceAreaId: kendraparaArea.id,
    sendChannels: ["in_app", "email"],
  });

  console.log("Demo data seeded.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
