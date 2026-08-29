# Project rules

## Goal

Build the complete Kisan Sahayak Portal MVP: a mobile-first farmer-facing procurement-slot booking portal and an admin operations console, using the attached specification and design tokens.

## Decisions

- Repo: `SIH-2026-tomcat/kisan-sahayak-portal`
- Project name: **Kisan Sahayak Portal**
- Deployment: Vercel (web) + Render (API) + Neon (DB) + Cloudinary (files)
- External services: Neon Auth for auth, Resend for transactional email, Cloudinary for Aadhaar docs, payment status mocked for hackathon
- Primary colour: green (`#1F6B3A`); saffron (`#E88A1A`) for highlights; blue used only for links/info
- Map: Leaflet + OpenStreetMap tiles with attribution
- Languages: English, Hindi, Telugu, Bengali
- DB: PostgreSQL on Neon, managed with Drizzle ORM
- Monorepo: npm workspaces (`apps/*`, `packages/*`)
- Real-time: SSE from API to web clients

## Conventions

- TypeScript strict mode in both apps
- `packages/db` owns the Drizzle schema and migrations; it is the single source of truth for DB types
- Business rules live in `apps/api` services/writers; no business logic in frontend code
- All user-facing strings are translation keys; no string concatenation
- Sensitive data is masked by default in admin lists
- All form inputs have visible labels, help text and human-readable errors
- Mobile-first CSS; test at 360px width
- No secrets committed to Git; all credentials via `.env.local` or deployment dashboards

## Verification

- `npm run typecheck` before any commit
- `npm run test` before any commit
- `npm run lint` before any commit
- Browser-automation smoke tests for critical user journeys