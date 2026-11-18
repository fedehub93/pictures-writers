# AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Overview

**Pictures Writers** is a full-stack CMS, blog and e-commerce platform on Next.js 16: public site, admin dashboard, Puck page builder, email marketing, ad campaigns, and a Stripe shop.

- `src/app/` — App Router (`(admin)`, `(auth)`, `(home)`, `api/`).
- `src/modules/<feature>/` — one folder per feature.
- `src/shared/` — code a second module may import; `src/puck/` — Puck config and blocks.

Commands live in `package.json`; environment variables in `docs/self-hosting/appendice-a-variabili-ambiente.md`. Read those rather than a copy here.

## Development Workflow

### Local databases

Point local development at the dedicated container on `localhost:5434` — PostgreSQL 18, the same major as production, so a production dump can be restored locally. Never point it at production: the dev automation pump fires real cron triggers every 15 seconds. The test database is PostgreSQL 16 on `localhost:5433`.

Both `docker-compose.yml` and `docker-compose.dev.yml` publish these ports on `127.0.0.1` only. A bare `5434:5432` also opens an IPv6 listener, and Docker Desktop on Windows accepts IPv6 connections it never forwards, so clients that resolve `localhost` to `::1` hang instead of failing. Both `src/lib/db.ts` and `src/shared/lib/db.ts` set a connect timeout for the same reason — a wedged connection must surface as an error, not as a `next build` that never finishes — and they must stay aligned, like the two auth files (gotcha 6).

**Ask before touching the development database.** Do not run `npm run dev:db:reset`, `docker compose down -v`, `prisma migrate reset`, `db push --force-reset`, or any `DROP`/`TRUNCATE`/`DELETE` against `pictures_writers_dev` without explicit confirmation from the user first: those commands discard data that is not reproducible from the repo. Prefer `dev:db:down` + `dev:db:up` to recreate a container (the volume survives), and ask before restoring a dump over the database as well.

**Agent sessions use a second database.** `npm run dev:agent` runs `next dev` against `pictures_writers_agent`, seeded by `npm run agent:env` + `npm run agent:seed` with a probe user and one page. `pictures_writers_dev` can be a restored production dump, so an agent that reads it sees real content, credentials and session tokens; the agent environment is the boundary that keeps those out of a session. Browser probes run through `node --env-file=.env.agent scripts/builder-probe.mjs` — see `docs/agents/browser-probe.md`.

The `dev:db:*` scripts pin their own Compose project (`pictures-writers-dev`) and `docker-compose.dev.yml`, which is separate from `docker-compose.yml`: resetting the test database cannot drop development data. Run SQL through a pipe instead of quoting it into a `-c` argument: `Get-Content q.sql | npm run -s dev:db:psql` on PowerShell, `npm run -s dev:db:psql < q.sql` on bash.

A failed compile or crashed request in development shows up in `.next/dev/logs/next-development.log`.

### Tests

Tests use Vitest (`vitest.config.ts`) and live beside the source or in `__tests__/`. They run only against the database in `.env.test`: `tests/test-db.ts` refuses to start if the file is missing or its `DATABASE_URL` matches the one in `.env`, and `tests/global-setup.ts` runs `prisma migrate deploy` against it. Keep that database disposable — tests run migrations and can wipe data.

`generated/prisma` is gitignored. When schema changes don't show up, run `npx prisma generate`: a stale client makes tests fail with "column does not exist".

### Before committing

Run `npm run check:doc-citations` when a change touches documentation or moves a file a doc names. Run `npm run lint`, `npm run typecheck` and the full test suite when it touches code. `.github/workflows/test.yml` runs all four checks on push to `main` and on pull requests. That workflow does not build, so run a production build before merging changes that touch routing, config or Prisma.

## Code Conventions

These are the implementation conventions. A reviewer judges what no tool can enforce against `CODING_STANDARDS.md`; the two files are halves of one standard.

- **Imports**: use the path aliases in `tsconfig.json` instead of relative chains.
- **Components**: server components by default. Interactive components import `"client-only"` at the top; vendored shadcn primitives in `src/shared/ui/` keep `"use client"`; server-only modules import `"server-only"`. The Puck client/server boundary is documented in `src/puck/config.ts` — read it before adding a directive to a block.
- **Feature modules**: inside `src/modules/<feature>/` the subfolders are a convention rather than a rule — `server/` for procedures and queries, `ui/` for components (split `admin/` and `public/` when both exist), `hooks/`, `lib/`, `store/` for Zustand. Code moves to `src/shared/` when a second module imports it, not in anticipation.

## Database

The Prisma schema is `prisma/schema.prisma`; the client generates to `generated/prisma` and is imported as `@/generated/prisma`. Schema changes ship with their migration files. Prisma maps models to quoted PascalCase tables and camelCase columns (`"PageRoot"`, `"puckData"`); `\dt` in `npm run -s dev:db:psql` lists them.

### Raw SQL

Prefer the typed client. When raw SQL is unavoidable, use the tagged templates (`db.$queryRaw` and `db.$executeRaw` with a template literal): interpolated values become bound parameters.

Never put request data in an SQL identifier (table, column, `ORDER BY`, direction). Identifiers come from a closed allow-list — see the exhaustive `switch` in `src/shared/lib/lock-root.ts`.

ESLint rejects `$queryRawUnsafe`, `$executeRawUnsafe` and `Prisma.raw`. The rare trusted exception (for example replaying a committed migration in a test) needs `// eslint-disable-next-line no-restricted-syntax` with a written justification.

## API Patterns

tRPC lives in `src/trpc/`: routers in `routers/_app.ts`, context and init in `init.ts`, React client in `client.tsx`, server caller in `server.tsx`. `protectedProcedure` checks the Better Auth session.

Some features use App Router API routes directly under `src/app/api/` — admin CRUD, checkout, media, products, UploadThing, webhooks. Both patterns are live; match the feature you are editing rather than introducing a third pattern.

## Build and Deployment

Production is a single Hetzner VPS (ARM64, Ubuntu) managed with Coolify. The Next.js app and PostgreSQL run as Docker containers in the same Coolify project; Coolify's Traefik terminates TLS with Let's Encrypt.

Coolify configuration:

| Setting | Value |
| --- | --- |
| Build pack | Nixpacks |
| Install command | `npm ci --include=dev` |
| Build command | `npx prisma migrate deploy && npm run build` |
| Start command | `sh scripts/start-production.sh` |
| Exposed port | `3000` |

Rules that follow from this setup:

- The build container must reach PostgreSQL because `next build` prerenders pages that call Prisma (`getSettings`, `generateStaticParams`, sitemap/robots). That is why migrations run inside the build command, before `next build`.
- Keep migrations in the build command and the start script. Don't use Coolify's "Pre-deployment command" for them: it runs in the old container and is skipped on the first deploy.
- Rolling deploys keep the old container alive while the new one builds, so migrations must be backwards compatible (expand/contract) and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` must stay stable.
- `NEXT_PUBLIC_*` variables are inlined at build time: changing one requires a redeploy, not a restart.
- ISR cache is in-memory and per instance. The deployment is single-instance by design; freshness relies on `revalidatePath` (ADR-0001), with the 24h ISR backstop as a safety net.
- Scheduled publication and automations still need the external cron-job.org jobs hitting `/api/scheduler/run/` and `/api/automations/run/`; there is no background worker inside the production container.

Operational docs:

- Deploy, rollback, backup and restore runbook: `docs/self-hosting/08-operations-runbook.md`
- Hosting decision: ADR-0032 (`docs/adr/0032-self-hosted-hetzner-coolify.md`)

## Common Gotchas

1. **Prisma binary tracing**: Next.js 16 may exclude the Prisma `.so.node` binary from the build trace. This is mitigated via `outputFileTracingIncludes` in `next.config.mjs` and matters for the self-hosted container too.

2. **Handlebars bundling**: Handlebars is aliased to `handlebars/dist/handlebars.js` in both Turbopack and Webpack configs.

3. **Trailing slashes**: `trailingSlash: true` is set. All route URLs use trailing slashes; `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` are bare origins without one.

4. **Images**: a custom loader is configured, so `/_next/image` is not used for media. Renditions are pregenerated at upload time (see ADR-0026); widths come from the shared ladder in `src/modules/media/lib/image-ladder.mjs`.

5. **No middleware file**: Auth is handled per-page via `requireAdminAuth()` (`src/shared/lib/auth-utils.ts`) and via Better Auth API routes.

6. **Two auth files**: There are two auth configurations — `src/lib/auth.ts` (used by API routes) and `src/shared/lib/auth.ts` (used by tRPC). Keep them in sync.

7. **Puck styles**: Puck base styles are imported in admin and home layouts. Custom blocks live in `src/puck/blocks/`.

8. **Puck canvas**: the canvas is an iframe and is not the page — block roots, selection clicks and markup parity differ. Read `docs/puck-canvas.md` before changing a block's interaction; for Puck internals read the `.reference/puck` clone (v0.24.0), not the minified `dist`.

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature-slug>/`. Closing one has its own protocol — status, checklist, a `## Comments` entry naming the landing commit, and a ticket-only `docs(<area>): close the <ticket> ticket` commit — in `docs/agents/issue-tracker.md`.

### Triage labels

Use the default triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo: root `GLOSSARY.md` plus `docs/adr/`. Read only the glossary sections for the terms in play, and start ADRs from the index in `docs/adr/README.md`. See `docs/agents/domain.md`.

### Marketing & SEO docs

Strategy, content, SEO, email and launch documents live in `docs/marketing/`. Start from `docs/marketing/README.md` for the map, reading order and current status.

Marketing skills look for `.agents/product-marketing.md`, which is a pointer to `docs/marketing/strategy/product-marketing.md` — the canonical product marketing context. Read that document, not the pointer.
