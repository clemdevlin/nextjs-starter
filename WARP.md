# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Install & Dev Server
- Install dependencies: `npm install`
- Run development server (Next.js with Turbopack): `npm run dev`
- Build production bundle: `npm run build`
- Start production server (after build): `npm start`

### Linting & Type Safety
- Run ESLint: `npm run lint`

Type-checking is handled by TypeScript via `next build` (no separate `typecheck` script is defined).

### Database / Drizzle
- Generate migrations from schema changes: `npm run db:generate`
- Apply migrations in dev (drizzle-kit migrate dev): `npm run db:migrate`
- Push schema to database (drizzle-kit push): `npm run db:push`

### Testing
No test runner or npm test scripts are currently configured in this repository. To add tests, introduce a test framework (e.g. Vitest/Jest/Playwright) and wire it into `package.json` scripts; until then there is no canonical `npm test` or "run a single test" command.

### Environment
- Local development uses `.env.local` as described in `README.md` (database, Better Auth, Google OAuth, Polar.sh, OpenAI, Cloudflare R2, pricing tier env vars).
- See `README.md` → "Quick Start" for the required environment variables and third-party setup (Neon, Polar.sh, Cloudflare R2, OpenAI, Google OAuth).

## High-Level Architecture

### Framework & Conventions
- Next.js 15 App Router with TypeScript, Tailwind CSS v4, shadcn/ui, and Radix UI.
- Server components by default; client components are used where interactivity is required (forms, dashboards, chat, uploads).
- Authentication and authorization are powered by Better Auth; subscriptions and billing by Polar.sh; storage by Cloudflare R2; analytics by PostHog.

### Top-Level Layout
- `app/`
  - Root application shell (`layout.tsx`, `globals.css`, favicon) and route segments.
  - Public marketing and legal pages (landing, pricing, terms, privacy, auth flows).
  - Authenticated dashboard area under `app/dashboard` with nested feature routes.
  - API routes under `app/api` implement server-side logic for auth, chat, subscriptions, and uploads.
- `components/`
  - Reusable UI primitives and shared layout pieces used by both marketing and app surfaces.
- `lib/`
  - Server-side domain logic for auth, subscriptions, file uploads, and general utilities.
- `db/`
  - Drizzle ORM configuration, schema definition, and migrations for Neon/PostgreSQL.
- `hooks/`
  - React hooks shared across components (e.g. responsive helpers).

### Routing & UI Structure
- **Public surface (`app/` root)**
  - `app/page.tsx`: main landing page using `components/homepage` sections and `components/logos`.
  - `app/pricing/page.tsx` + `app/pricing/_component/pricing-table.tsx`: marketing pricing page wired to Polar product IDs exposed via `NEXT_PUBLIC_*` env vars.
  - `app/sign-in/page.tsx` and `app/sign-up/page.tsx`: auth entrypoints hooking into Better Auth flows from `lib/auth.ts` and `lib/auth-client.ts`.
  - `app/terms-of-service/page.tsx` and `app/privacy-policy/page.tsx`: static content for legal pages.
  - `app/success/page.tsx`: post-purchase / post-subscription success page.

- **Dashboard (`app/dashboard`)**
  - `app/dashboard/layout.tsx`: wraps all dashboard routes with common navigation (`navbar`, `sidebar`, theme toggle, etc.) and provides the protected shell.
  - `app/dashboard/page.tsx`: main analytics / overview view, using `app/dashboard/_components` like `chart-interactive`, `section-cards`, etc.
  - `app/dashboard/chat/page.tsx`: AI chat experience, calling `app/api/chat/route.ts` and rendering responses via Markdown components.
  - `app/dashboard/upload/page.tsx`: R2-backed file/image upload UI with drag-and-drop and progress tracking, calling `app/api/upload-image/route.ts` and helpers from `lib/upload-image.ts`.
  - `app/dashboard/payment/page.tsx`: subscription and billing management UI (status, upgrades, cancelation), backed by Polar via `lib/subscription.ts` and the `subscription` API route.
  - `app/dashboard/settings/page.tsx`: user account settings including profile, auth-linked providers, and possibly billing metadata.
  - `app/dashboard/_components/*`: dashboard-specific building blocks (navigation, charts, chatbot wrapper, theme toggle, section cards, etc.), built on top of `components/ui` primitives.

- **API routes (`app/api`)**
  - `app/api/auth/[...all]/route.ts`: Better Auth adapter endpoint handling sign-in, callbacks, sessions, etc.
  - `app/api/chat/route.ts`: server endpoint orchestrating OpenAI / AI-SDK calls to power the dashboard chat; returns streamed or batched messages consumed on the client.
  - `app/api/subscription/route.ts`: handles subscription lifecycle events (e.g. Polar webhooks or internal subscription actions) and gates access to premium features.
  - `app/api/upload-image/route.ts`: handles authenticated uploads to Cloudflare R2 using `@aws-sdk/client-s3` and helpers from `lib/upload-image.ts`.

### Shared UI & Design System
- `components/ui/*` provides the design system layer based on shadcn/ui + Radix primitives (buttons, forms, inputs, dialogs, dropdowns, sheets, tabs, charts, etc.). These components are the preferred way to build new UIs in both the marketing site and dashboard.
- `components/homepage/*` contains landing-specific building blocks (hero, integrations strip, footer, etc.).
- `components/logos/*` encapsulates vendor logos (Better Auth, Neon, Next.js, Polar, shadcn, Tailwind) as React components consumed in both marketing and dashboard views.

### Auth, Subscription, and Upload Logic
- `lib/auth.ts`
  - Central Better Auth configuration: providers (Google OAuth), session strategy, callbacks, and integration with Neon/Drizzle.
  - Exposes server helpers (e.g. "get current user") consumed in server components, API routes, and middleware.
- `lib/auth-client.ts`
  - Client-side helpers used by React components to initiate sign-in/sign-out, link accounts, and handle auth flows.
- `lib/subscription.ts`
  - Encapsulates subscription domain logic: checking active status, mapping Polar product IDs to app features, reading/writing subscription records in the database, and gating dashboard features.
- `lib/upload-image.ts`
  - Isolates Cloudflare R2 integration: creating an S3-compatible client, validating inputs, performing uploads, and returning signed URLs or metadata for UI consumption.
- `lib/utils.ts`
  - Small general-purpose utilities (e.g. className merging, formatting helpers) used across components.

### Database Layer
- `db/schema.ts`
  - Drizzle schema for users, sessions, subscriptions, uploads, and any other domain entities.
  - Acts as the single source of truth for data modeling; changes here are propagated via Drizzle migrations.
- `db/drizzle.ts`
  - Initializes the Drizzle ORM client against Neon/PostgreSQL using `DATABASE_URL`.
- `db/migrations/*`
  - SQL and metadata files generated by Drizzle Kit; these should not be hand-edited.

### Middleware & Config
- `middleware.ts`
  - Next.js middleware used to enforce auth on protected routes (e.g. `/dashboard/**`), read Better Auth session cookies, and possibly attach analytics or feature flags.
- `next.config.ts`
  - Next.js configuration for the app (images, experimental flags, Turbopack options, etc.).
- `drizzle.config.ts`
  - Configuration for Drizzle Kit (schema locations, out directory, database driver).
- `tailwind.config.ts` and `postcss.config.mjs`
  - Tailwind and PostCSS configuration for styling and CSS processing.
- `eslint.config.mjs` and `tsconfig.json`
  - Lint and TypeScript project configuration.

## How Future Warp Instances Should Work Here

- Prefer using existing domain helpers in `lib/` (auth, subscription, upload-image) instead of duplicating logic in components or API routes.
- When adding new authenticated routes, co-locate UI under `app/dashboard/...` and wire server logic via `app/api/...` or server components that call into `lib` and `db`.
- For schema changes, always update `db/schema.ts` and then run `npm run db:generate` followed by `npm run db:migrate` (for dev) or `npm run db:push` (when pushing schema to a managed environment).
- Reuse `components/ui` primitives and follow Tailwind + shadcn patterns rather than introducing ad-hoc styling systems.
- Keep environment-variable-driven behavior consistent with `README.md` (especially for Better Auth, Polar.sh, OpenAI, Neon, and Cloudflare R2); new features that depend on third-party services should extend that pattern.