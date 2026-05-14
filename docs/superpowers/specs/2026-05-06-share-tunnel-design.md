---
title: Share Web App via Cloudflare Tunnel (Windows)
date: 2026-05-06
scope: workspace
---

## Goal

Let non-technical testers access the TEAMSPIRIT web app for a short period at zero cost, by running the app on a developer machine and exposing it over HTTPS with Cloudflare Tunnel.

## Constraints

- Frontend calls API via same-origin `/api` and relies on cookie sessions (`credentials: "include"`), so the shared URL must keep frontend + backend on the same origin.
- Current dev setup uses Vite proxy (`/api`, `/ws`, `/uploads`) to the API server.
- This is for temporary testing, so machine uptime is required.

## Proposed Solution

Add a single command `pnpm share` (cross-platform, works on Windows) that:

1. Builds and starts API server on `http://localhost:3000`
2. Starts TEAMSPIRIT Vite dev server on `http://localhost:5173`
3. Starts `cloudflared tunnel --url http://localhost:5173` and prints the `https://*.trycloudflare.com` URL

## Behavior Details

- Uses `PORT=3000` for API server and `PORT=5173` for Vite.
- Uses a random `SESSION_SECRET` if not provided.
- Forwards Ctrl+C to stop child processes cleanly.
- If `cloudflared` is missing, prints installation instructions (winget).

## Verification

- `pnpm share` shows a `trycloudflare.com` URL in the terminal.
- Opening that URL from another device loads the app and login works.

