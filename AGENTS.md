# AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Overview

**Pictures Writers** is a full-stack CMS, blog, and e-commerce platform built with Next.js 16. It features a public-facing website, an admin dashboard for content management, a visual page builder (Puck editor), email marketing tools, ad campaign management, and a shop with Stripe payments.

### Key Technologies

- **Framework**: Next.js 16 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS v4, Sass (for some files), shadcn/ui components
- **Database**: PostgreSQL via Prisma (with `@prisma/adapter-pg`)
- **API**: tRPC (v11) + Next.js App Router API routes
- **Auth**: Better Auth with Prisma adapter (email/password)
- **Payments**: Stripe (checkout + webhooks)
- **Email**: SendGrid, Resend, React Email Editor
- **File uploads**: UploadThing
- **Page builder**: Puck editor (`@puckeditor/core`)
- **Rich text**: TipTap + Slate
- **Forms**: React Hook Form + Valibot/Zod
- **State**: Zustand, TanStack Query (React Query)
- **Tables**: TanStack Table
- **Drag & drop**: `@hello-pangea/dnd`, `@dnd-kit/react`

### Architecture

The project uses Next.js App Router with route groups:

- `(admin)/admin/*` — Admin dashboard (protected, Inter font, TRPC provider, sidebar layout)
- `(auth)/sign-in` — Authentication pages
- `(home)/*` — Public site (Figtree font, blog, shop, landing pages)
- `api/*` — API routes (REST-style + tRPC + auth + webhooks)

Feature modules live under `src/modules/*` (blog, mails, forms, pages, dashboard). Shared code lives under `src/shared/*`. The Puck visual editor configuration and custom blocks live under `src/puck/*`.

---

## Setup Commands

### Install dependencies

```bash
npm install
```

### Environment variables

Create `.env` (see existing `.env` for reference). Required variables include:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXT_PUBLIC_APP_URL` — e.g. `http://localhost:3000`
- `UPLOADTHING_TOKEN` — UploadThing token
- `NEXT_SENDGRID_KEY` — SendGrid API key
- `NEXT_RESEND_KEY` — Resend API key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_API_KEY` / `STRIPE_WEBHOOK_SECRET`
- `NEXT_GA_TRACKING_ID` / `NEXT_GTAG_CONTAINER_ID` — Google Analytics/Tag Manager
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` — reCAPTCHA

### Database setup

```bash
# Generate Prisma client (also runs automatically on postinstall)
npx prisma generate

# Run migrations
npx prisma migrate dev

# Deploy migrations (production/Vercel)
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

The Prisma schema is at `prisma/schema.prisma`. The generated client outputs to `generated/prisma` and is imported via `@/generated/prisma`.

---

## Development Workflow

### Start the development server

```bash
npm run dev
```

This uses Turbopack by default. To use Webpack instead:

```bash
npm run dev -- --webpack
```

### Build for production

```bash
npm run build
```

To build with Webpack:

```bash
npm run build-webpack
```

To analyze bundle size:

```bash
npm run build:analyze
```

### Vercel build (includes Prisma steps)

```bash
npm run vercel-build
```

This runs `prisma generate`, `prisma migrate deploy`, and `next build`.

### Start production server

```bash
npm run start
```

---

## Testing Instructions

There are currently **no automated tests** in this project. If you add tests:

- Place test files alongside source files or in a `__tests__` directory
- The project uses TypeScript — consider Vitest or Jest with `ts-jest`

> **IMPORTANT**: Vitest runs only against a dedicated test database defined in `.env.test` (its `DATABASE_URL` database name must contain `test`); it refuses to touch the dev/production `DATABASE_URL` in `.env`. To keep test isolation, test files may clean the tables they use on that test database.

Before committing, always run:

```bash
npm run lint
```

---

## Code Style Guidelines

### Linting

```bash
npm run lint
```

ESLint config is in `eslint.config.mjs`. It extends:

- `eslint-config-next/core-web-vitals`
- `eslint-config-next/typescript`

Key rules:

- `@typescript-eslint/no-unused-vars` is on — prefix unused variables/args with `_` to suppress warnings
- `@typescript-eslint/no-namespace` allows declarations

### TypeScript

- Strict mode enabled
- Module resolution: `bundler`
- Target: `ES2017`
- Isolated modules enabled

### Import aliases

```
@/*              → ./src/*
@/modules/*      → ./src/modules/*
@/shared/*       → ./src/shared/*
@/generated/*    → ./generated/*
@/generated/prisma → ./generated/prisma
```

### Tailwind CSS v4

- Global CSS imports (no `tailwind.config.ts` in use — Tailwind v4 CSS-based config)
- PostCSS config in `postcss.config.js`
- Animate utilities from `tailwindcss-animate` and `tw-animate-css`

### Component conventions

- Uses **shadcn/ui** components in `src/shared/ui/*`
- Components are mostly React Server Components unless they need interactivity
- Client components should import `"client-only"` at the top
- Server-only code should import `"server-only"` at the top

### File organization patterns

```
src/
  app/              → Next.js App Router pages and layouts
    (admin)/        → Admin route group
    (auth)/         → Auth route group
    (home)/         → Public site route group
    api/            → API routes
  modules/          → Feature modules (blog, mails, forms, pages, etc.)
    <feature>/
      server/       → Server-side code (API procedures, queries)
      ui/           → UI components (admin/, public/)
      hooks/        → React hooks
      lib/          → Utilities
      store/        → Zustand stores
  shared/           → Shared code across modules
    ui/             → shadcn/ui components
    lib/            → Shared utilities (db.ts, auth.ts, utils.ts)
    components/     → Shared components
    hooks/          → Shared hooks
    providers/      → React context providers
  puck/             → Puck editor configuration and custom blocks
  actions/          → Next.js Server Actions
  data/             → Data fetching helpers
  constants/        → App constants
  schemas/          → Validation schemas
  store/            → Global stores
  styles/           → Global styles
  trpc/             → tRPC setup (client, server, routers, init)
```

---

## Build and Deployment

### Build output

- Next.js builds to `.next/`
- Images are configured as `unoptimized: true` in `next.config.mjs`
- Trailing slashes are enabled (`trailingSlash: true`)

### Deployment (Vercel)

The project is configured for Vercel:

```bash
npm run vercel-build
```

This handles Prisma generate, migrate deploy, and Next.js build.

### Important build config

- `outputFileTracingIncludes` includes Prisma client files to avoid runtime errors in Next.js 16
- Handlebars is aliased to the dist build in both Turbopack and Webpack configs
- React Compiler is enabled
- Typed routes are enabled

---

## Auth and Authorization

### Authentication

- **Better Auth** with Prisma adapter (`src/lib/auth.ts` and `src/shared/lib/auth.ts`)
- Email/password login enabled with auto sign-in
- Auth API route: `/api/auth/[...all]` (GET/POST handlers)
- Custom session plugin adds `role` and `imageUrl` to sessions

### Admin access

- Admin routes use `requireAdminAuth()` to protect pages
- Admin layout is at `src/app/(admin)/layout.tsx`
- Role-based access is enforced via session role

---

## Database

### Prisma setup

- Schema: `prisma/schema.prisma`
- Client output: `generated/prisma`
- Adapter: `@prisma/adapter-pg` (PostgreSQL)
- Generator: `prisma-json-types-generator` for typed JSON fields

### Key models

- `User`, `Session`, `Account` — Better Auth
- `Post`, `Category`, `Tag` — Blog
- `Product`, `ShopCategory`, `Review` — Shop
- `Page` — CMS pages (with Puck data)
- `Form`, `FormSubmission` — Forms
- `Audience`, `Contact`, `SingleSend`, `Template` — Email marketing
- `Campaign`, `Block`, `Item` — Ad campaigns
- `Settings`, `Language`, `Widget` — Site configuration

---

## API Patterns

### tRPC

- tRPC router: `src/trpc/routers/_app.ts`
- tRPC init/context: `src/trpc/init.ts`
- React client: `src/trpc/client.tsx`
- Server caller: `src/trpc/server.tsx`
- Protected procedures use `protectedProcedure` which checks Better Auth session

### App Router API routes

Some features use Next.js App Router API routes directly under `src/app/api/`, including:

- Admin CRUD APIs (`/api/admin/*`)
- Auth API (`/api/auth/[...all]`)
- Checkout API (`/api/checkout`)
- Database API (`/api/database`)
- Media API (`/api/media`)
- Products API (`/api/products`)
- UploadThing API (`/api/uploadthing`)
- Webhooks (`/api/webhooks/*`)

---

## Common Gotchas

1. **Prisma binary on Vercel**: Next.js 16 may exclude Prisma `.so.node` binary. This is mitigated via `outputFileTracingIncludes` in `next.config.mjs`.

2. **Handlebars bundling**: Handlebars is aliased to `handlebars/dist/handlebars.js` in both Turbopack and Webpack configs.

3. **Trailing slashes**: `trailingSlash: true` is set. All URLs should use trailing slashes.

4. **Images**: `unoptimized: true` is set. Next.js Image component won't optimize images automatically.

5. **No middleware file**: Auth is handled per-page via `requireAdminAuth()` and via Better Auth API routes.

6. **Two auth files**: There are two auth configurations — `src/lib/auth.ts` (used by API routes) and `src/shared/lib/auth.ts` (used by tRPC). Keep them in sync.

7. **Puck styles**: Puck base styles are imported in admin and home layouts. Custom blocks live in `src/puck/blocks/`.

---

## Pull Request Guidelines

- Run `npm run lint` before committing
- Ensure `npm run build` passes
- For DB schema changes, include migration files (`npx prisma migrate dev`)
- Update Prisma client if schema changed (`npx prisma generate`)

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo using root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.
