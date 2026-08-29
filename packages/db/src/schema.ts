import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  unique,
  index,
  decimal,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "farmer",
  "admin",
  "super_admin",
  "support_agent",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "verified",
  "rejected",
]);

export const centreStatusEnum = pgEnum("centre_status", [
  "active",
  "paused",
  "closed",
]);

export const slotStatusEnum = pgEnum("slot_status", [
  "draft",
  "scheduled",
  "open",
  "full",
  "closed",
  "cancelled",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "arrived",
  "procured",
  "payment_initiated",
  "payment_completed",
  "payment_failed",
  "cancelled",
]);

export const announcementAudienceEnum = pgEnum("announcement_audience", [
  "all",
  "service_area",
  "active_bookings",
]);

export const messageChannelEnum = pgEnum("message_channel", [
  "email",
  "sms",
  "in_app",
]);

export const messageStatusEnum = pgEnum("message_status", [
  "pending",
  "sent",
  "failed",
]);

export const languageEnum = pgEnum("language", [
  "en",
  "hi",
  "te",
  "bn",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalAuthId: text("external_auth_id").unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    mobile: varchar("mobile", { length: 15 }).notNull().unique(),
    role: userRoleEnum("role").notNull().default("farmer"),
    language: languageEnum("language").notNull().default("en"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    mobileVerifiedAt: timestamp("mobile_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    mobileIdx: index("users_mobile_idx").on(table.mobile),
  })
);

export const usersRelations = relations(users, ({ one, many }) => ({
  farmerProfile: one(farmerProfiles),
  bookings: many(bookings),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}));

export const farmerProfiles = pgTable(
  "farmer_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    village: varchar("village", { length: 255 }),
    district: varchar("district", { length: 255 }).notNull(),
    state: varchar("state", { length: 255 }).notNull(),
    pincode: varchar("pincode", { length: 10 }).notNull(),
    serviceAreaId: uuid("service_area_id").references(() => serviceAreas.id),
    aadhaarRef: text("aadhaar_ref"),
    aadhaarLast4: varchar("aadhaar_last4", { length: 4 }),
    aadhaarDocumentId: text("aadhaar_document_id"),
    verificationStatus: verificationStatusEnum("verification_status").notNull().default("pending"),
    consentGivenAt: timestamp("consent_given_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("farmer_profiles_user_id_idx").on(table.userId),
    pincodeIdx: index("farmer_profiles_pincode_idx").on(table.pincode),
    serviceAreaIdx: index("farmer_profiles_service_area_id_idx").on(table.serviceAreaId),
  })
);

export const farmerProfilesRelations = relations(farmerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [farmerProfiles.userId],
    references: [users.id],
  }),
  serviceArea: one(serviceAreas, {
    fields: [farmerProfiles.serviceAreaId],
    references: [serviceAreas.id],
  }),
}));

export const serviceAreas = pgTable(
  "service_areas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    state: varchar("state", { length: 255 }).notNull(),
    district: varchar("district", { length: 255 }).notNull(),
    subDistrict: varchar("sub_district", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    codeIdx: index("service_areas_code_idx").on(table.code),
    districtIdx: index("service_areas_district_idx").on(table.district),
  })
);

export const serviceAreasRelations = relations(serviceAreas, ({ many }) => ({
  pincodes: many(areaPincodes),
  centres: many(centreAreaMap),
  farmers: many(farmerProfiles),
  announcements: many(announcements),
}));

export const areaPincodes = pgTable(
  "area_pincodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceAreaId: uuid("service_area_id")
      .notNull()
      .references(() => serviceAreas.id, { onDelete: "cascade" }),
    pincode: varchar("pincode", { length: 10 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pincodeIdx: index("area_pincodes_pincode_idx").on(table.pincode),
    serviceAreaIdx: index("area_pincodes_service_area_id_idx").on(table.serviceAreaId),
  })
);

export const areaPincodesRelations = relations(areaPincodes, ({ one }) => ({
  serviceArea: one(serviceAreas, {
    fields: [areaPincodes.serviceAreaId],
    references: [serviceAreas.id],
  }),
}));

export const centres = pgTable(
  "centres",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address").notNull(),
    pincode: varchar("pincode", { length: 10 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    district: varchar("district", { length: 255 }).notNull(),
    state: varchar("state", { length: 255 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 20 }),
    openingHours: text("opening_hours"),
    commodities: text("commodities").array().notNull().default([]),
    status: centreStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pincodeIdx: index("centres_pincode_idx").on(table.pincode),
    statusIdx: index("centres_status_idx").on(table.status),
  })
);

export const centresRelations = relations(centres, ({ many }) => ({
  serviceAreas: many(centreAreaMap),
  slots: many(slots),
}));

export const centreAreaMap = pgTable(
  "centre_area_map",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    centreId: uuid("centre_id")
      .notNull()
      .references(() => centres.id, { onDelete: "cascade" }),
    serviceAreaId: uuid("service_area_id")
      .notNull()
      .references(() => serviceAreas.id, { onDelete: "cascade" }),
    priority: integer("priority").notNull().default(0),
    effectiveFrom: date("effective_from").notNull().defaultNow(),
    effectiveTo: date("effective_to"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    centreServiceAreaUnique: unique("centre_service_area_unique").on(
      table.centreId,
      table.serviceAreaId
    ),
    centreIdx: index("centre_area_map_centre_id_idx").on(table.centreId),
    serviceAreaIdx: index("centre_area_map_service_area_id_idx").on(table.serviceAreaId),
  })
);

export const centreAreaMapRelations = relations(centreAreaMap, ({ one }) => ({
  centre: one(centres, {
    fields: [centreAreaMap.centreId],
    references: [centres.id],
  }),
  serviceArea: one(serviceAreas, {
    fields: [centreAreaMap.serviceAreaId],
    references: [serviceAreas.id],
  }),
}));

export const procurementWindows = pgTable(
  "procurement_windows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    commodity: varchar("commodity", { length: 255 }).notNull(),
    season: varchar("season", { length: 255 }).notNull(),
    year: integer("year").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: slotStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    commodityYearIdx: index("procurement_windows_commodity_year_idx").on(
      table.commodity,
      table.year
    ),
  })
);

export const procurementWindowsRelations = relations(procurementWindows, ({ many }) => ({
  slots: many(slots),
  bookings: many(bookings),
}));

export const slots = pgTable(
  "slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    centreId: uuid("centre_id")
      .notNull()
      .references(() => centres.id, { onDelete: "cascade" }),
    procurementWindowId: uuid("procurement_window_id")
      .notNull()
      .references(() => procurementWindows.id, { onDelete: "cascade" }),
    slotDate: date("slot_date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    capacity: integer("capacity").notNull(),
    bookedCount: integer("booked_count").notNull().default(0),
    status: slotStatusEnum("status").notNull().default("draft"),
    publishAt: timestamp("publish_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    centreDateIdx: index("slots_centre_date_idx").on(table.centreId, table.slotDate),
    windowIdx: index("slots_procurement_window_id_idx").on(table.procurementWindowId),
    statusIdx: index("slots_status_idx").on(table.status),
  })
);

export const slotsRelations = relations(slots, ({ one, many }) => ({
  centre: one(centres, {
    fields: [slots.centreId],
    references: [centres.id],
  }),
  procurementWindow: one(procurementWindows, {
    fields: [slots.procurementWindowId],
    references: [procurementWindows.id],
  }),
  bookings: many(bookings),
}));

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    farmerId: uuid("farmer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => slots.id, { onDelete: "cascade" }),
    bookingCode: varchar("booking_code", { length: 20 }).notNull().unique(),
    tokenNumber: integer("token_number"),
    status: bookingStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    farmerSlotUnique: unique("farmer_slot_unique").on(table.farmerId, table.slotId),
    farmerIdx: index("bookings_farmer_id_idx").on(table.farmerId),
    slotIdx: index("bookings_slot_id_idx").on(table.slotId),
    codeIdx: index("bookings_booking_code_idx").on(table.bookingCode),
  })
);

export const bookingsRelations = relations(bookings, ({ one }) => ({
  farmer: one(users, {
    fields: [bookings.farmerId],
    references: [users.id],
  }),
  slot: one(slots, {
    fields: [bookings.slotId],
    references: [slots.id],
  }),
}));

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    audienceType: announcementAudienceEnum("audience_type").notNull().default("all"),
    serviceAreaId: uuid("service_area_id").references(() => serviceAreas.id, { onDelete: "set null" }),
    sendChannels: messageChannelEnum("send_channels").array().notNull().default(["in_app"]),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    audienceIdx: index("announcements_audience_type_idx").on(table.audienceType),
    serviceAreaIdx: index("announcements_service_area_id_idx").on(table.serviceAreaId),
  })
);

export const announcementsRelations = relations(announcements, ({ one }) => ({
  serviceArea: one(serviceAreas, {
    fields: [announcements.serviceAreaId],
    references: [serviceAreas.id],
  }),
  creator: one(users, {
    fields: [announcements.createdBy],
    references: [users.id],
  }),
}));

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("notifications_user_id_idx").on(table.userId),
    readIdx: index("notifications_read_at_idx").on(table.readAt),
  })
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const outboundMessages = pgTable(
  "outbound_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: messageChannelEnum("channel").notNull(),
    templateKey: varchar("template_key", { length: 255 }).notNull(),
    payload: jsonb("payload").notNull(),
    status: messageStatusEnum("status").notNull().default("pending"),
    providerMessageId: text("provider_message_id"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("outbound_messages_user_id_idx").on(table.userId),
    statusIdx: index("outbound_messages_status_idx").on(table.status),
  })
);

export const outboundMessagesRelations = relations(outboundMessages, ({ one }) => ({
  user: one(users, {
    fields: [outboundMessages.userId],
    references: [users.id],
  }),
}));

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 255 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    actorIdx: index("audit_logs_actor_user_id_idx").on(table.actorUserId),
    entityIdx: index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  })
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id],
  }),
}));
