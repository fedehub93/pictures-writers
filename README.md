# Pictures Writers

Full-stack CMS, blog and shop built with Next.js 16, React 19, Prisma and PostgreSQL. It powers a public website, an admin dashboard, a Puck page builder, email marketing, automations and Stripe checkout.

## Local development

```bash
npm install
npm run dev
```

The dev server runs on [http://localhost:3000](http://localhost:3000) with Turbopack.

Prisma runs against a local PostgreSQL database. Create `.env` from the existing reference, then:

```bash
npx prisma migrate dev
npx prisma studio   # optional
```

For tests, use the disposable PostgreSQL container (port `5433`):

```bash
npm run test:db:up
npm run test:run
npm run test:db:down
```

`.env.test` must point at a dedicated test database; Vitest refuses to run against the dev or production database.

## Useful commands

```bash
npm run lint                 # ESLint
npm run test:run             # Vitest, single run
npm run build                # Next.js production build
npm run build:production     # Prisma generate + migrate deploy + build
npm run start                # next start
```

## Architecture

- `src/app/` — App Router pages, admin/auth/home route groups and API routes
- `src/modules/` — feature modules (blog, mails, forms, pages, dashboard, media, scheduler, automations)
- `src/shared/` — shared UI, hooks, providers and server utilities
- `src/puck/` — Puck editor configuration and custom blocks
- `prisma/schema.prisma` — database schema

## Deployment

Production runs on a self-hosted Hetzner VPS (ARM64) managed with Coolify. The Next.js app and PostgreSQL run as Docker containers; Coolify's Traefik handles TLS and the reverse proxy. There is no Vercel deployment and no Neon database.

- Coolify build command: `npx prisma migrate deploy && npm run build`
- Coolify start command: `sh scripts/start-production.sh`
- Environment variables live in Coolify, not in a file on the server
- Deployment, rollback, backup and restore: `docs/self-hosting/08-operations-runbook.md`
- Environment variable reference: `docs/self-hosting/appendice-a-variabili-ambiente.md`
- Hosting decision: `docs/adr/0032-self-hosted-hetzner-coolify.md`

Agent instructions and project conventions are in `AGENTS.md`; the domain glossary is in `CONTEXT.md`.
