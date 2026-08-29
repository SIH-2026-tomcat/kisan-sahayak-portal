-- Add new enum value for operations admin role
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'operations_admin';--> statement-breakpoint

-- Booking: link to procurement window + payment/cancellation tracking
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "procurement_window_id" uuid;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_reference" varchar(64);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp with time zone;--> statement-breakpoint

-- Backfill procurement_window_id from the booked slot
UPDATE "bookings" b
SET "procurement_window_id" = s."procurement_window_id"
FROM "slots" s
WHERE s."id" = b."slot_id" AND b."procurement_window_id" IS NULL;--> statement-breakpoint

-- Deduplicate: keep the earliest active booking per (farmer, window), cancel later duplicates
UPDATE "bookings" b
SET "status" = 'cancelled', "cancelled_at" = now()
WHERE b."status" <> 'cancelled'
  AND EXISTS (
    SELECT 1 FROM "bookings" b2
    WHERE b2."farmer_id" = b."farmer_id"
      AND b2."procurement_window_id" = b."procurement_window_id"
      AND b2."status" <> 'cancelled'
      AND (b2."created_at" < b."created_at" OR (b2."created_at" = b."created_at" AND b2."id" < b."id"))
  );--> statement-breakpoint

ALTER TABLE "bookings" ALTER COLUMN "procurement_window_id" SET NOT NULL;--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_procurement_window_id_procurement_windows_id_fk" FOREIGN KEY ("procurement_window_id") REFERENCES "public"."procurement_windows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "bookings_farmer_window_active_uniq" ON "bookings" USING btree ("farmer_id","procurement_window_id") WHERE "status" <> 'cancelled';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_procurement_window_id_idx" ON "bookings" USING btree ("procurement_window_id");
