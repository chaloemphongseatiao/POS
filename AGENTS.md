# AGENTS.md

Guidance for AI coding agents working in this repository. Mirrors `CLAUDE.md`.

## Project

POS system for a Thai retail/convenience store. Two apps in one repo:

- `WebAPI/` - Express 5 + TypeScript + Prisma REST API
- `WebApp/` - Next.js 14 App Router + TypeScript frontend

## Commands

### WebAPI (`cd WebAPI`)
- `npm run dev` - start with nodemon + tsx, http://localhost:3001
- `npm run build` - `tsc` to `dist/`
- `npm start` - run built `dist/index.js`
- `npm run db:migrate` - `prisma migrate dev`
- `npm run db:seed` - runs `prisma/seed.ts`
- `npm run db:studio` - Prisma Studio

### WebApp (`cd WebApp`)
- `npm run dev` - Next dev server, http://localhost:3000
- `npm run build` / `npm start`

No test runner or lint script is configured for either app.

## Architecture

### WebAPI

Domain modules live under `src/modules/<name>/` with route/controller/service files. Routes are mounted under `/api/<module>` in `WebAPI/src/app.ts`.

Current modules: `auth`, `users`, `categories`, `products`, `stock`, `orders`, `refunds`, `reports`, `settings`, `line`, `promotions`.

Auth uses JWT bearer token. `authenticate` sets `req.user = { id, role }`; `requireRole("ADMIN")` gates owner-only writes.

Errors use `createError(message, statusCode)`. The global error handler maps Prisma `P2002` to 409 and `P2025` to 404.

Env vars are validated in `src/config/env.ts`: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`.

### Data Model

`WebAPI/prisma/schema.prisma` uses PostgreSQL. Do not create SQLite migrations for this repo.

Core flow: `Category` -> `Product` -> `Stock` + `StockMovement`; `Order` -> `OrderItem` -> `Product`; refunds use `Refund` + `RefundItem`. Orders snapshot `unitPrice` and `costPrice` onto `OrderItem`.

Product data includes stock thresholds, reorder fields, and optional `expiryDate`. Promotions use `Promotion` + `ProductPromotion`; active promotion discounts are applied during order creation and folded into bill `discountAmt`.

### WebApp

Route groups: `(auth)/login` and `(main)/*`. Main layout redirects unauthenticated users to `/login`.

State is Zustand:
- `useAuth` - persisted token/user
- `useCart` - POS cart
- `useLoading`, `useToast` - global UI state from axios interceptors

API calls go through `src/lib/api/client.ts`. Shared domain types live in `src/lib/types/index.ts`.

Admin-only screens include products, stock, reports, barcode labels, promotions, and settings.

`WebApp/NewDesing/` is static design reference, not part of the built app.
