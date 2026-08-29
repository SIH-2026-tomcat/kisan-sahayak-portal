# Kisan Sahayak Portal — Feature Guide

**Smart India Hackathon 2026 · Problem Statement 26032**
Ministry of Consumer Affairs, Food & Public Distribution — Department of Consumer Affairs

> Prototype for hackathon evaluation. Not an official Government of India service. Emblem
> and ministry marks are prototype crops to be replaced with official masters before any
> public release (spec §24).

---

## 1. What the portal solves

Farmers lose time and money because procurement schedules, centre locations and queue
lengths are unpredictable. Kisan Sahayak Portal gives every farmer a single place to:

- find the procurement centre mapped to their pincode,
- book a specific time slot before travelling,
- see live capacity (a full slot says so — it never lets two farmers overbook),
- track procurement and payment status after the visit,

…and gives government staff an operations console to configure centres, publish capacity,
broadcast announcements and monitor demand in real time.

The whole experience is delivered in **English, हिन्दी, తెలుగు and বাংলা**, mobile-first, and
usable at 360 px with no horizontal scroll.

---

## 2. System architecture

| Layer | Technology | Notes |
|---|---|---|
| Web (both portals) | Next.js 14 App Router, React 18, Tailwind | One shared design system; farmer + admin differ by layout, not hue |
| API | Fastify 4 (ESM), Zod validation | All business rules server-side; DB is the single source of truth |
| Database | Neon Postgres + Drizzle ORM | 13 tables, hand-tuned migrations |
| Auth | Neon Auth (Managed Better Auth) | Email + password + email OTP verification |
| File storage | Cloudinary (private/authenticated) | Dedicated folder `kisan-sahayak/aadhaar/<userId>/…` |
| Email | Resend | Sender `kisansahayak@hawkvance.in` |
| Realtime | Server-Sent Events over an in-process event bus | Farmer booking + admin dashboard subscribe |
| Hosting | Vercel (web) + Vercel serverless (API) | Neon for data/auth |

**Request path:** the browser only ever calls **same-origin Next.js route handlers**
(`/api/bff/*`, `/api/auth/*`, `/api/events`). Those handlers read the Neon Auth session,
mint a short-lived internal HS256 token and forward to Fastify. The API also accepts real
Neon EdDSA JWTs verified through JWKS. Roles live in the `users` table, never in the token.

---

## 3. People (Farmer) Portal

### 3.1 Public pages (no login)

| Page | Contents |
|---|---|
| **Home** (`/`) | Government of India band, hero, national-vision section with portrait, "What this portal does", **multi-lingual support callout**, current procurement notice, About summary, government schemes, tricolour accents and a waving-flag + rotating Ashoka Chakra ornament |
| **About** (`/about`) | Ministry / department identity with the Department of Consumer Affairs lockup, purpose, "how it works", data-use explanation |
| **Schemes & Awareness** (`/schemes`) | PM-KISAN, PMFBY, e-NAM cards with official source links and "last checked" dates; short awareness pieces |
| **Help & Support** (`/help`) | FAQ, contact, grievance pointer |

### 3.2 Registration — 4-step wizard (`/register`)

1. **Contact verification** — create the Neon Auth account (name, email, password),
   capture the Indian mobile number, verify email with a 6-digit OTP (continue-and-verify-later
   is allowed).
2. **Your details** — address, and **pincode → district + state auto-fill**. Entering a
   6-digit pincode calls the India Post PIN API (offline prefix table as fallback); district
   and state fill in and lock, with a "Not correct? Edit manually" escape hatch. A banner
   confirms whether a procurement service area covers the pincode.
3. **Aadhaar document** — Aadhaar number + document upload (camera-first on mobile), stored
   privately in Cloudinary; a profile shell is created if it does not exist yet.
4. **Check your details** — review with masked contact + masked Aadhaar, consent checkbox,
   create.

Every step has spec-compliant human-readable errors (OTP wrong/expired, upload failed,
account exists, session expired…).

### 3.3 Authenticated farmer screens

| Screen | Features |
|---|---|
| **Dashboard** (`/dashboard`) | Greeting, "your next procurement visit" card (centre / date / time / token / status), latest announcements, quick links; empty states for "no coverage" and "no booking" |
| **Procurement** (`/procurement`) | Season banner, centre rules (commodity, documents, arrival guidance, hours), vertical process timeline (book → arrive → weigh → procurement update → payment update), FAQ accordion |
| **Slot Booking** (`/book`) | "Your area" summary (no free search), **Open / Upcoming / Closed** tabs, slot cards (commodity, centre, distance if geolocation granted, date, time, remaining capacity), **live SSE updates** — cards flip to *Full* and newly published slots appear without refresh — map + always-present text list, confirm dialogue, spec errors (slot just filled, not eligible, duplicate window, window closed) |
| **Booking confirmation** (`/book/[bookingId]`) | Success banner, booking ID near the top, centre name + address, date/time, token, map/directions, add-to-calendar (`.ics`), preparation notes, policy-guarded cancel |
| **My Bookings** (`/my-bookings`) | List + detail, status/payment timeline (payment shown only when the record exists), centre contact/directions |
| **Announcements** (`/announcements`) | Notification centre (unread count, chronological feed, mark-read / mark-all-read) + announcement cards, toast on new (SSE), critical-banner style for closures |
| **Profile** (`/profile`) | Name, masked mobile/email, service area, verification state, language selector, signed "view my Aadhaar document" link, help, always-visible logout |

---

## 4. Government Admin Portal (`/admin`)

Separate `admin-login` (authorised-access-only branding, tricolour, role check), a denser
side-nav layout, and a **"Live data connected / Live connection lost"** realtime banner.

| Screen | Features |
|---|---|
| **Dashboard** (`/admin`) | Metric cards (registered farmers, active centres, bookings today, pending payment/verification), **bookings-vs-capacity chart**, recent activity from the audit log, quick actions |
| **Farmers** (`/admin/farmers`) | Search (name / masked mobile / email), filters (area, verification, booking state), table **masked by default**, detail drawer with **role-gated unmasking that writes an audit log row**, verification actions |
| **Centres** (`/admin/centres`) | Full CRUD — name, address, pincode, lat/lng, district, service area, contact, hours, commodities, status — plus `centre_area_map` eligibility mapping and a farmer-facing preview; invalid-mapping error |
| **Slot Management** (`/admin/slots`) | Create (centre, commodity/season, date, start, end, capacity) with validation (end > start, capacity > 0, overlap warning), live booked/capacity/remaining counts over SSE, publish / close / cancel; publish fans out a "new slots released" notification + email to eligible farmers |
| **Announcements** (`/admin/announcements`) | Composer (title, message, audience = all / service area / active bookings, channels in-app + email), fan-out to `notifications` + `outbound_messages`, recipient count, no-recipients and email-provider-error states, audit trail |
| **Bookings** (`/admin/bookings`) | Operational list, status changes, **mocked payment** (`payment_initiated / completed / failed`) with farmer notification |
| **Reports** (`/admin/reports`) | Bookings by centre/day, capacity utilisation, verification funnel |
| **Audit trail** (`/admin/audit`) | Chronological feed of every sensitive action |
| **Settings** (`/admin/settings`) | Admin profile, language, MFA placeholder |

**RBAC:** `farmer | operations_admin | super_admin | support_agent`. `provisionUser`
self-heals user rows and re-applies `super_admin` when the email matches `ADMIN_EMAIL`.

---

## 5. Cross-cutting capabilities

### 5.1 Transactional booking (no overbooking)
`bookSlot()` runs a Postgres transaction: `SELECT … FOR UPDATE` on the slot, capacity check,
per-slot unique `(farmer_id, slot_id)`, and a **partial unique index on
`(farmer_id, procurement_window_id) WHERE status <> 'cancelled'`** so a farmer cannot hold
two active bookings for the same procurement window. When the last seat is taken the slot
transitions to `full`. A Vitest concurrency test fires N parallel bookings at a capacity-M
slot and asserts exactly M succeed.

### 5.2 Realtime (SSE)
An in-process event bus publishes slot and announcement changes; `GET /events` streams them
(scoped by service area for farmers, all events for admins) with a 25 s heartbeat. The web
proxies the stream through a route handler so the browser stays same-origin.

### 5.3 Notifications & email
Every triggering action writes a `notifications` row (in-app) **and** an `outbound_messages`
row (email queue) in the same transaction. Delivery is best-effort inline via Resend plus a
polling worker backstop. Templates: booking confirmed, slot released, slot full, booking
cancelled, centre closed, announcement, payment update, procurement update — rendered in the
recipient's language.

### 5.4 Pincode → location resolution
`GET /geo/pincode/:pincode` returns `{ state, district, source }` using the India Post PIN
API first and a curated offline prefix table as fallback. Used by registration to auto-fill
and lock district/state. `GET /areas/by-pincode/:pincode` additionally resolves the mapped
procurement service area and eligible active centres.

### 5.5 Internationalisation
Custom lightweight i18n: dot-path key lookup + `{{var}}` interpolation with English fallback.
`en.json` is authored in full; `hi/te/bn` carry spec-bank translations and are flagged for
native review. The language selector writes a cookie and `POST /auth/language`, and switches
every UI string, notification and error message. Fonts: Noto Sans + Devanagari + Telugu +
Bengali via `next/font`.

### 5.6 Security & privacy
- Aadhaar files uploaded as Cloudinary `type: authenticated` (never public); read-back only
  through a short-lived signed URL, self or audited-admin only.
- Sensitive fields masked by default in the admin portal; unmasking is permissioned and
  audit-logged.
- Neon Auth session cookies, internal tokens are short-lived (30 min) and server-side only.
- Rate limiting on auth, profile, upload, booking and announcement endpoints.
- Signed Neon Auth webhook (`POST /webhooks/neon`).

### 5.7 Accessibility
WCAG AA contrast, visible focus rings, semantic landmarks + skip link, 44 px targets,
`prefers-reduced-motion` (the flag ornament and chakra stop animating), 360 px no-horizontal-scroll,
and a text list always paired with every map.

### 5.8 National identity theming
Government-of-India visual language throughout both portals: the State Emblem lockup, a
"Government of India · Ministry…" top band, tricolour accent strips under every header, an
Indian-flag colour system, and a fixed bottom-right ornament — a waving tricolour flag with
**ribbon streamers and a rotating 24-spoke Ashoka Chakra** (calmed by reduced-motion, hidden
on small screens where a bottom nav is present). Partner marks (Digital India, MyGov, Food
Corporation of India) in the footer.

---

## 6. Acceptance criteria (spec §21)

| # | Criterion | Where it lives |
|---|---|---|
| 1 | Register with verified email (mobile stored) | `/register` step 1 + Neon Auth email OTP |
| 2 | Log in with email **or** registered mobile | `/login` (mobile resolves to the same account) |
| 3 | Address + pincode → configured service area | `/register` step 2, `GET /areas/by-pincode/:pincode` |
| 4 | Aadhaar → private Cloudinary + stored reference | `POST /farmers/aadhaar-document` |
| 5 | Only active centres mapped to the service area | `GET /centres?serviceAreaId=` |
| 6 | Admin creates a centre and maps it | `/admin/centres` |
| 7 | Admin creates + publishes a slot | `/admin/slots` |
| 8 | Farmer sees the new slot without refresh | `/book` SSE subscription |
| 9 | Atomic capacity decrement; no overbooking | `bookSlot()` transaction + concurrency test |
| 10 | Slot at capacity → "Full" and unavailable | slot `full` transition + `/book` UI |
| 11 | Booking → in-app notification + email event | `notifications` + `outbound_messages` in the booking tx |
| 12 | Announcement to all / service-area audience | `/admin/announcements` |
| 13 | Farmer gets toast + notification entry | `/announcements` + SSE toast |
| 14 | Language selector switches en/hi/te/bn | header + profile selector |
| 15 | 360 px usable, no horizontal scroll | verified on home, book, dashboard |
| 16 | Admin farmer list masks mobile/email/Aadhaar | `/admin/farmers` |
| 17 | Human-readable errors + recovery everywhere | every form + API `{ error, message }` |

---

## 7. Deployment

| Target | URL | Project |
|---|---|---|
| People + Admin Portal | https://web-rust-sigma-11.vercel.app | Vercel `web` |
| API | https://kisan-sahayak-api.vercel.app | Vercel `kisan-sahayak-api` (serverless Fastify) |
| Database + Auth | Neon project `empty-block-33823651` | — |

Deploy scripts: `scripts/deploy-vercel.mjs` (web) and `scripts/deploy-vercel-api.mjs` (API)
push environment variables via the Vercel API, then `vercel deploy --prod`. Any new web
domain must also be added to the Neon Auth trusted-origin list
(`npx neonctl neon-auth domain add <url> --project-id empty-block-33823651`).

**Branch:** active development is on `Kritanta-Sasan-Roy`.

### Demo accounts (prod Neon Auth)
- Admin — `admin@hawkvance.in` / `AdminPass12345`
- Farmer — `farmer.demo@hawkvance.in` / `DemoFarmer2026`
- Reseed — `SEED_RESET=true npm run db:seed` (3 service areas incl. one with no centre,
  3 centres, 1 open Rice / Kharif 2026 window, 6 slots covering open / near-full / upcoming
  / closed, 4 farmers, sample bookings + notifications + one announcement).

### Local dev
`npm run dev` → web `:3000`, API `:3001`. `.env.local` at the repo root holds every secret
(git-ignored). `packages/db/dist` is committed so the serverless API can resolve `@kisan/db`.

---

## 8. Known limitations / production handoff

- **Mobile OTP is descoped** — the mobile number is collected and stored but not SMS-verified;
  login treats it as a "registered" number. Acceptance criterion 1's "verified mobile" is
  explicitly reduced to "registered mobile" for the MVP.
- **hi / te / bn translations** are spec-bank + machine assisted and flagged "needs native review".
- **SSE uses an in-process bus** — it does not fan out across multiple serverless instances
  (acceptable for hackathon traffic; a production build would use Postgres `LISTEN/NOTIFY`
  or a broker).
- The outbound email worker's `setInterval` is unreliable on serverless; inline delivery is
  the primary path.
- All Government of India marks and the leadership portrait are **prototype assets** and must
  be replaced with official masters (and usage cleared) before any public release.
