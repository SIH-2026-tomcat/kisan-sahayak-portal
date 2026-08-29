# Kisan Sahayak Portal

Farmer Procurement Portal MVP for the SIH 2026 hackathon.

- **People Portal:** mobile-first farmer-facing web app for registration, slot booking, notifications and scheme awareness.
- **Government Admin Portal:** desktop-oriented operations console for centres, slots, announcements, farmer search and live booking counts.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router + React + TypeScript + Tailwind CSS |
| Backend API | Fastify + TypeScript |
| Database | Neon PostgreSQL |
| ORM / migrations | Drizzle ORM |
| Auth | Neon Auth |
| File storage | Cloudinary private assets (Aadhaar) |
| Email | Resend |
| Map | Leaflet + OSM tiles |
| Realtime | Server-Sent Events (SSE) |
| Languages | English, Hindi, Telugu, Bengali |

## Repository layout

```
kisan-sahayak-portal/
  apps/
    web/          # Next.js farmer + admin portals
    api/          # Fastify API
  packages/
    db/           # Drizzle schema, migrations and seeders
  docs/
    charter.md    # MVP acceptance criteria
    domain-model.md
  seed/           # Demo data scripts
```

## Local setup

1. Copy `.env.example` to `.env.local` and fill in the real values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run database migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
4. Seed demo data:
   ```bash
   npm run db:seed
   ```
5. Run both apps:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — run web (port 3000) and API (port 3001)
- `npm run build` — build all workspaces
- `npm run db:migrate` — apply migrations
- `npm run db:seed` — seed demo data
- `npm run test` — run tests
- `npm run lint` — run linting
- `npm run typecheck` — run TypeScript checks

## Design tokens

Primary green `#1F6B3A`, deep green `#15542D`, saffron `#E88A1A`, paper/cream `#F7F4ED`, blue reserved for links and info accents only. See `apps/web/src/styles/tokens.css`.

## Important notes

- All secrets live in `.env.local` (gitignored). Never commit real credentials.
- Aadhaar documents are stored as Cloudinary authenticated/private assets and never served from a public bucket.
- All UI copy uses translation keys for the four supported languages.
- Slot capacity is enforced by a database transaction with row-level locking; the server is the only source of truth for booking state.