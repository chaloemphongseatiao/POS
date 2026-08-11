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

Modules: `auth`, `users`, `categories`, `products`, `stock`, `orders`, `refunds`, `reports`, `settings`, `line`, `promotions`. All routes are mounted under `/api/<module>` in [WebAPI/src/app.ts](WebAPI/src/app.ts). Auth is JWT bearer token (`src/lib/jwt.ts`, `src/middleware/auth.ts` sets `req.user = { id, role }`); role gate is `src/middleware/requireRole.ts` with two roles: `ADMIN`, `CASHIER`.

Errors: throw `createError(message, statusCode)` from `src/middleware/errorHandler.ts` inside services; the global error handler also maps Prisma `P2002` (unique constraint) → 409 and `P2025` (not found) → 404. User-facing error messages are in Thai.

Env vars are validated with zod in `src/config/env.ts` (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`) — invalid/missing env exits the process on boot.

Side effects that shouldn't block the request (e.g. LINE Messaging API push notification on order creation, `src/lib/line.ts`) are fired without awaiting and swallow their own errors.

### Data model (`WebAPI/prisma/schema.prisma`)

Core chain: `Category` → `Product` → `Stock` (1:1 current qty) + `StockMovement` (audit log of `STOCK_IN`/`STOCK_OUT`/`SALE`/`ADJUST`/`RETURN`). `Order` → `OrderItem` → `Product`; creating an order is a single `prisma.$transaction` (see `createOrder` in [WebAPI/src/modules/orders/orders.service.ts](WebAPI/src/modules/orders/orders.service.ts)) that snapshots `unitPrice`/`costPrice` onto the `OrderItem` so historical orders aren't affected by later price changes.

`Refund` → `RefundItem` returns part or all of a bill: it increments `OrderItem.refundedQty` (guarded inside the transaction so two registers can't over-refund the same line), optionally restocks, and moves the order to `PARTIAL_REFUND` / `REFUNDED`. Refund amounts are scaled by the bill's discount ratio, so a discounted sale never pays back more than the customer paid.

**Costing:** every profit figure in the system comes from `src/lib/profit.ts` — `orderCost()` for a single bill, `marginPct()` (profit ÷ selling price) and `markupPct()` (profit ÷ cost, "กำไรต่อทุน") for the two ratios the UI shows side by side. Refunded lines are stripped from both revenue and cost, and a `VOIDED` bill is worth nothing, so a bill's own figures always reconcile with the reports over the same range. Cost, profit and `OrderItem.costPrice` are owner-only: services always compute them and the controllers strip them for `CASHIER` (`isAdmin` from `src/lib/permissions.ts`), the same pattern products already used.

`Shift` (cash-drawer session) still exists in the schema, along with the nullable `shiftId` on `Order`/`Refund`, but the feature was removed — no API module, no UI, and nothing writes `shiftId` anymore. The tables were kept rather than dropped so the data is still there if the feature comes back. `Setting` is a generic key-value store (used for LINE integration token/userId). Money fields are Prisma `Decimal`; the API/frontend pass them around as strings.

`Product` also carries `reorderPoint`/`reorderQty` (feeds the low-stock reorder report) and an optional `expiryDate` (feeds the expiry-loss report); both date-only inputs are read as Bangkok-local through `src/lib/datetime.ts`, not UTC. `Promotion` → `ProductPromotion` (many-to-many) defines percent- or amount-off deals with an optional `minQty`/date window; `createOrder`'s `promotionDiscount()` applies every active, in-window promotion that matches a line's product, sums per-product before capping at that line's subtotal (so overlapping promotions can't discount past 100%), and folds the result into the bill's `discountAmt` alongside any manual discount. The POS cart mirrors this client-side (`src/lib/utils/promotion.ts` in WebApp) so the quoted total — and the exact QR PromptPay amount — matches what `createOrder` actually charges.

**Database:** Postgres everywhere (the migrations and `migration_lock.toml` are Postgres-only; the leftover `prisma/dev.db` is from the old sqlite setup and is dead). Two URLs are required — `DATABASE_URL` (pooled, what the app uses) and `DIRECT_URL` (unpooled, what migrations use); `prisma.config.ts` also accepts Vercel's `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING`. Missing `DIRECT_URL` makes every Prisma CLI command fail with `P1012`. Against a local Postgres both URLs are the same string; see `WebAPI/.env.example`.

### WebApp: App Router + Zustand stores + axios client

Route groups: `(auth)/login` (public) and `(main)/*` (dashboard, pos, products, stock, orders, reports, promotions, labels, settings) wrapped by [WebApp/src/app/(main)/layout.tsx](WebApp/src/app/(main)/layout.tsx), which redirects to `/login` if unauthenticated once the auth store is `initialized`.

State is Zustand, not React context:
- `useAuth` (`src/lib/hooks/useAuth.ts`) — token/user, persisted to `localStorage` (remember-me) or `sessionStorage`; `initAuth()` must run once on client startup to hydrate from storage
- `useCart` (`src/lib/hooks/useCart.ts`) — POS sale-in-progress cart, client-only, not persisted
- `useLoading`, `useToast` — global UI state driven from the axios interceptors, not from components

API calls go through `src/lib/api/client.ts`, one axios instance shared by per-domain modules in `src/lib/api/*.ts` (mirrors the WebAPI module names). The interceptors: attach the bearer token from storage, drive the global loading bar, and on any error show a toast — except 401, which logs out and hard-redirects to `/login`. Because of this, individual API call sites generally don't need their own error handling for auth/network failures.

`NEXT_PUBLIC_API_URL` (in `.env.local`) points the frontend at the WebAPI base URL — must be reachable from the browser (e.g. a LAN IP, not `localhost`, when testing from another device).

Shared domain types live in `src/lib/types/index.ts` and are hand-kept in sync with the Prisma models / API responses (no generated client).

`WebApp/NewDesing/` is a static HTML design mockup/reference, not part of the built app.
