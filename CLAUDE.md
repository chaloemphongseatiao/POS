# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

POS (point-of-sale) system for a retail/convenience store, in Thai. Two apps in one repo:

- `WebAPI/` — Express 5 + TypeScript + Prisma REST API
- `WebApp/` — Next.js 14 (App Router) + TypeScript frontend

## Commands

### WebAPI (`cd WebAPI`)
- `npm run dev` — start with nodemon + tsx (watches `src`), http://localhost:3001
- `npm run build` — `tsc` to `dist/`
- `npm start` — run built `dist/index.js`
- `npm run db:migrate` — `prisma migrate dev`
- `npm run db:seed` — runs `prisma/seed.ts` (also seeds per-category via `seed-*.ts` files)
- `npm run db:studio` — Prisma Studio

No test runner or lint script is configured for either app.

### WebApp (`cd WebApp`)
- `npm run dev` — Next dev server, http://localhost:3000
- `npm run build` / `npm start`

### Run both at once
- `dev.bat` (repo root) opens two terminal windows for WebAPI (:3001) and WebApp (:3000)
- `.vscode/tasks.json` auto-starts both dev servers on folder open
- `docker-compose.yml` runs postgres + api + webapp as containers (see gotcha below)

## Architecture

### WebAPI: module-per-domain, controller → service → Prisma

Each domain under `src/modules/<name>/` has three files:
- `<name>.routes.ts` — Express router; wires `authenticate` / `requireRole("ADMIN")` middleware, delegates to controller
- `<name>.controller.ts` — parses/validates req, calls service, shapes res
- `<name>.service.ts` — business logic, all Prisma calls

Modules: `auth`, `users`, `categories`, `products`, `stock`, `orders`, `reports`, `settings`. All routes are mounted under `/api/<module>` in [WebAPI/src/app.ts](WebAPI/src/app.ts). Auth is JWT bearer token (`src/lib/jwt.ts`, `src/middleware/auth.ts` sets `req.user = { id, role }`); role gate is `src/middleware/requireRole.ts` with two roles: `ADMIN`, `CASHIER`.

Errors: throw `createError(message, statusCode)` from `src/middleware/errorHandler.ts` inside services; the global error handler also maps Prisma `P2002` (unique constraint) → 409 and `P2025` (not found) → 404. User-facing error messages are in Thai.

Env vars are validated with zod in `src/config/env.ts` (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`) — invalid/missing env exits the process on boot.

Side effects that shouldn't block the request (e.g. LINE Messaging API push notification on order creation, `src/lib/line.ts`) are fired without awaiting and swallow their own errors.

### Data model (`WebAPI/prisma/schema.prisma`)

Core chain: `Category` → `Product` → `Stock` (1:1 current qty) + `StockMovement` (audit log of `STOCK_IN`/`STOCK_OUT`/`SALE`/`ADJUST`). `Order` → `OrderItem` → `Product`; creating an order is a single `prisma.$transaction` (see `createOrder` in [WebAPI/src/modules/orders/orders.service.ts](WebAPI/src/modules/orders/orders.service.ts)) that snapshots `unitPrice`/`costPrice` onto the `OrderItem` so historical orders aren't affected by later price changes. `Setting` is a generic key-value store (used for LINE integration token/userId). Money fields are Prisma `Decimal`; the API/frontend pass them around as strings.

**Gotcha:** `schema.prisma` datasource provider is `sqlite` and local dev (`WebAPI/.env`) points at `file:./dev.db`, but `docker-compose.yml` passes a `postgresql://...` `DATABASE_URL` to the `api` container. These are not interchangeable — check which environment you're targeting before touching migrations, and don't assume the docker path currently works against the sqlite-generated migrations.

### WebApp: App Router + Zustand stores + axios client

Route groups: `(auth)/login` (public) and `(main)/*` (dashboard, pos, products, orders, settings) wrapped by [WebApp/src/app/(main)/layout.tsx](WebApp/src/app/(main)/layout.tsx), which redirects to `/login` if unauthenticated once the auth store is `initialized`.

State is Zustand, not React context:
- `useAuth` (`src/lib/hooks/useAuth.ts`) — token/user, persisted to `localStorage` (remember-me) or `sessionStorage`; `initAuth()` must run once on client startup to hydrate from storage
- `useCart` (`src/lib/hooks/useCart.ts`) — POS sale-in-progress cart, client-only, not persisted
- `useLoading`, `useToast` — global UI state driven from the axios interceptors, not from components

API calls go through `src/lib/api/client.ts`, one axios instance shared by per-domain modules in `src/lib/api/*.ts` (mirrors the WebAPI module names). The interceptors: attach the bearer token from storage, drive the global loading bar, and on any error show a toast — except 401, which logs out and hard-redirects to `/login`. Because of this, individual API call sites generally don't need their own error handling for auth/network failures.

`NEXT_PUBLIC_API_URL` (in `.env.local`) points the frontend at the WebAPI base URL — must be reachable from the browser (e.g. a LAN IP, not `localhost`, when testing from another device).

Shared domain types live in `src/lib/types/index.ts` and are hand-kept in sync with the Prisma models / API responses (no generated client).

`WebApp/NewDesing/` is a static HTML design mockup/reference, not part of the built app.
