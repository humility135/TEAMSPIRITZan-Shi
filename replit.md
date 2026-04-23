# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## TEAMSPIRIT artifact

HK amateur football SaaS (zh-HK Cantonese). Architecture:

- **DB schema** in `lib/db/src/schema/*.ts` — users, otp, teams + team_members, venues, events, public_matches + match_comments, host_profiles, notifications, orders. ID-list arrays are stored as `text[]`; slot offers as JSONB.
- **API server** (`artifacts/api-server`) — Express + Drizzle + zod (inline; no Orval codegen for this artifact). Cookie auth (HMAC-signed `ts_session`, set via `cookie-parser`), `requireAuth` middleware. 30-second background tick (`expireTick.ts`) expires unpaid slot offers and re-opens them to next waitlist user.
- **Auth** — phone-OTP only (no KYC). Mock OTP is always `123456`. `POST /api/auth/request-otp` then `POST /api/auth/verify-otp` (auto-creates user on first verify, sets cookie).
- **Mock payments** — `POST /api/{events,public-matches}/:id/slot-offers/:offerId/pay` instantly succeeds and writes a row into `orders` (`status: paid`).
- **Frontend** (`artifacts/teamspirit`) — `AppProvider` (`src/lib/store.tsx`) preserves the original `useAppStore()` façade but is backed entirely by React Query against the API. 401 from `/auth/me` redirects to `/login`. Polling: events / public matches / notifications every 30s.
- **Seed** — `pnpm --filter @workspace/scripts run seed` repopulates demo data (users `91110001`/`91110002`/`91110003`, teams t1/t2, etc.).
