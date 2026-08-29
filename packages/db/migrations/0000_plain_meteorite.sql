DO $$ BEGIN
 CREATE TYPE "public"."announcement_audience" AS ENUM('all', 'service_area', 'active_bookings');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'arrived', 'procured', 'payment_initiated', 'payment_completed', 'payment_failed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."centre_status" AS ENUM('active', 'paused', 'closed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."language" AS ENUM('en', 'hi', 'te', 'bn');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."message_channel" AS ENUM('email', 'sms', 'in_app');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."message_status" AS ENUM('pending', 'sent', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."slot_status" AS ENUM('draft', 'scheduled', 'open', 'full', 'closed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('farmer', 'admin', 'super_admin', 'support_agent');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"audience_type" "announcement_audience" DEFAULT 'all' NOT NULL,
	"service_area_id" uuid,
	"send_channels" message_channel[] DEFAULT '{"in_app"}' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "area_pincodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_area_id" uuid NOT NULL,
	"pincode" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(255) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"booking_code" varchar(20) NOT NULL,
	"token_number" integer,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_booking_code_unique" UNIQUE("booking_code"),
	CONSTRAINT "farmer_slot_unique" UNIQUE("farmer_id","slot_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "centre_area_map" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"centre_id" uuid NOT NULL,
	"service_area_id" uuid NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"effective_from" date DEFAULT now() NOT NULL,
	"effective_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "centre_service_area_unique" UNIQUE("centre_id","service_area_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "centres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"pincode" varchar(10) NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"district" varchar(255) NOT NULL,
	"state" varchar(255) NOT NULL,
	"contact_phone" varchar(20),
	"opening_hours" text,
	"commodities" text[] DEFAULT '{}' NOT NULL,
	"status" "centre_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "farmer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"village" varchar(255),
	"district" varchar(255) NOT NULL,
	"state" varchar(255) NOT NULL,
	"pincode" varchar(10) NOT NULL,
	"service_area_id" uuid,
	"aadhaar_ref" text,
	"aadhaar_last4" varchar(4),
	"aadhaar_document_id" text,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"consent_given_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "farmer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outbound_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" "message_channel" NOT NULL,
	"template_key" varchar(255) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "message_status" DEFAULT 'pending' NOT NULL,
	"provider_message_id" text,
	"sent_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "procurement_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commodity" varchar(255) NOT NULL,
	"season" varchar(255) NOT NULL,
	"year" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "slot_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"state" varchar(255) NOT NULL,
	"district" varchar(255) NOT NULL,
	"sub_district" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_areas_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"centre_id" uuid NOT NULL,
	"procurement_window_id" uuid NOT NULL,
	"slot_date" date NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"capacity" integer NOT NULL,
	"booked_count" integer DEFAULT 0 NOT NULL,
	"status" "slot_status" DEFAULT 'draft' NOT NULL,
	"publish_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_auth_id" text,
	"email" varchar(255) NOT NULL,
	"mobile" varchar(15) NOT NULL,
	"role" "user_role" DEFAULT 'farmer' NOT NULL,
	"language" "language" DEFAULT 'en' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"mobile_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_external_auth_id_unique" UNIQUE("external_auth_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_mobile_unique" UNIQUE("mobile")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "announcements" ADD CONSTRAINT "announcements_service_area_id_service_areas_id_fk" FOREIGN KEY ("service_area_id") REFERENCES "public"."service_areas"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "area_pincodes" ADD CONSTRAINT "area_pincodes_service_area_id_service_areas_id_fk" FOREIGN KEY ("service_area_id") REFERENCES "public"."service_areas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_farmer_id_users_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slot_id_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."slots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "centre_area_map" ADD CONSTRAINT "centre_area_map_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "centre_area_map" ADD CONSTRAINT "centre_area_map_service_area_id_service_areas_id_fk" FOREIGN KEY ("service_area_id") REFERENCES "public"."service_areas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "farmer_profiles" ADD CONSTRAINT "farmer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "farmer_profiles" ADD CONSTRAINT "farmer_profiles_service_area_id_service_areas_id_fk" FOREIGN KEY ("service_area_id") REFERENCES "public"."service_areas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outbound_messages" ADD CONSTRAINT "outbound_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "slots" ADD CONSTRAINT "slots_centre_id_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."centres"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "slots" ADD CONSTRAINT "slots_procurement_window_id_procurement_windows_id_fk" FOREIGN KEY ("procurement_window_id") REFERENCES "public"."procurement_windows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "announcements_audience_type_idx" ON "announcements" USING btree ("audience_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "announcements_service_area_id_idx" ON "announcements" USING btree ("service_area_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "area_pincodes_pincode_idx" ON "area_pincodes" USING btree ("pincode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "area_pincodes_service_area_id_idx" ON "area_pincodes" USING btree ("service_area_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_actor_user_id_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_farmer_id_idx" ON "bookings" USING btree ("farmer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_slot_id_idx" ON "bookings" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_booking_code_idx" ON "bookings" USING btree ("booking_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "centre_area_map_centre_id_idx" ON "centre_area_map" USING btree ("centre_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "centre_area_map_service_area_id_idx" ON "centre_area_map" USING btree ("service_area_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "centres_pincode_idx" ON "centres" USING btree ("pincode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "centres_status_idx" ON "centres" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "farmer_profiles_user_id_idx" ON "farmer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "farmer_profiles_pincode_idx" ON "farmer_profiles" USING btree ("pincode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "farmer_profiles_service_area_id_idx" ON "farmer_profiles" USING btree ("service_area_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_read_at_idx" ON "notifications" USING btree ("read_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outbound_messages_user_id_idx" ON "outbound_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outbound_messages_status_idx" ON "outbound_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "procurement_windows_commodity_year_idx" ON "procurement_windows" USING btree ("commodity","year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_areas_code_idx" ON "service_areas" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_areas_district_idx" ON "service_areas" USING btree ("district");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slots_centre_date_idx" ON "slots" USING btree ("centre_id","slot_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slots_procurement_window_id_idx" ON "slots" USING btree ("procurement_window_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slots_status_idx" ON "slots" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_mobile_idx" ON "users" USING btree ("mobile");