# Self-host the application on a Hetzner VPS with Coolify

**Status**: accepted

Pictures Writers used to run on Vercel (Next.js serverless) with a Neon PostgreSQL database. Both services were replaced by a single Hetzner CAX21 VPS (ARM64, Ubuntu 24.04) managed with Coolify: the Next.js application runs as a container with `next start`, PostgreSQL runs as a sibling container in the same Coolify project, and Coolify's Traefik terminates TLS with Let's Encrypt.

We moved because the Vercel + Neon split put the runtime, the database, the scheduler and the cost model in three places, while the workload is a single-instance CMS whose build already needs a reachable PostgreSQL during `next build`. A private VPS keeps the application and its database in one place, removes serverless execution limits and provider-specific build behaviour, and makes backups and restores a documented, portable procedure.

The trade-off is operational responsibility: the VPS must be hardened, patched and backed up, and there is no platform scheduler or background worker. Deployments are rolling container replacements instead of immutable serverless deployments, so migrations must be backwards compatible. Scheduled publication and automations keep their external cron-job.org jobs, and the ISR cache remains in-memory and per instance, which is acceptable for the single-instance design (see ADR-0001).

Consequences:

- Coolify builds with Nixpacks: `npm ci --include=dev`, then `npx prisma migrate deploy && npm run build`; the start command is `sh scripts/start-production.sh`.
- The build container must reach PostgreSQL because prerendering calls Prisma; migrations run before `next build` for that reason.
- Environment variables live in the Coolify application environment. `NEXT_PUBLIC_*` values are inlined at build time and require a redeploy, not a restart.
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` must stay stable across rolling deploys so Server Actions issued by the old container keep working.
- UploadThing and the email/payment providers stay external; moving media storage is a separate decision (ADR-0026).
- The migration plan and its historical context live in `docs/self-hosting/`; day-to-day operations live in `docs/self-hosting/08-operations-runbook.md`.

## Considered options

- **Keep Vercel + Neon**: no server maintenance, but split runtime/database ownership, serverless limits and a scheduler that depends on an external cron anyway. Rejected.
- **Single VPS with Coolify (chosen)**: one place for app, database, TLS, backups and cron; portable Docker deployment; more operational work.
- **Other managed platforms (Fly.io, Railway, Render)**: still split the runtime and database across providers and add a new vendor-specific deployment model. Rejected.
