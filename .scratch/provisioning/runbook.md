# Provisioning runbook

The ordered, restartable sequence the Control plane follows to turn one paid Tenant into one working Installation. Every step is idempotent: a failure at step *n* is fixed and the whole sequence is re-run, never partially cleaned by hand.

## Preconditions on the Host (once, not per Tenant)

- PostgreSQL container reachable by the Control plane.
- Docker + Coolify, with the API enabled, a bearer token scoped to the team, and an IP allowlist covering the Control plane.
- Wildcard DNS `*.spindlecms.com` and a wildcard certificate (DNS-01, renewed outside the request path).
- One private Docker network shared by the Installations, so the Control plane can reach them without exposing the cron endpoints.
- UploadThing, Stripe, email providers: not configured at this level. They are Integrations inside each Installation.

## Registry

One row per Tenant in the Control plane's database. Nothing here is ever written into the Installation.

| Field | Purpose |
| --- | --- |
| `slug` | Immutable identity; the database name and subdomain derive from it |
| `domain` | `<slug>.spindlecms.com` today, a custom hostname later |
| `app_uuid` | Coolify application id |
| `image_tag` | Release the Installation runs |
| `status` | `provisioning` → `ready` / `failed` / `suspended` |
| `secrets` | `BETTER_AUTH_SECRET`, `SECRETS_ENCRYPTION_KEY`, `SCHEDULED_PUBLICATION_SECRET`, `BOOTSTRAP_SECRET` — generated once, stored encrypted, backed up |
| `step` | Last completed step, for resume |

## Sequence

### 1. Reserve identity

Insert the row with `status=provisioning`, `step=0`. Generate all four secrets. Refuse a slug that is not `^[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?$` or that collides with a reserved name (`admin`, `api`, `www`, `media`, `status`, `docs`).

Idempotent by `slug` unique constraint.

### 2. Create the database and its role

```sql
CREATE ROLE "tenant_<slug>" LOGIN PASSWORD '<generated>';
CREATE DATABASE "tenant_<slug>" OWNER "tenant_<slug>";
```

Both statements fail if they already exist; treat "already exists" as success. Keep the password in the registry next to the other secrets.

Rationale: one cluster, one database per Tenant, one role scoped to its own database. A leaked `DATABASE_URL` cannot read another Tenant.

### 3. Create the application from the image

`POST /applications/dockerimage` (verified) with the image `ghcr.io/<org>/spindle:<tag>`, the name `spindle-<slug>`, and the server.

Do **not** create the application from a Git repository: a repository-backed app builds per Tenant, which ADR-0036 exists to prevent, and a Docker-image app has no Git webhook that could redeploy a stale state.

### 4. Set the environment

`POST /applications/{uuid}/envs` (verified) once per variable:

| Variable | Scope | Value |
| --- | --- | --- |
| `DATABASE_URL` | Installation | `postgresql://tenant_<slug>:<pw>@<host>:5432/tenant_<slug>` |
| `BETTER_AUTH_URL` | Installation | `https://<domain>` |
| `BETTER_AUTH_SECRET` | Installation | generated |
| `SECRETS_ENCRYPTION_KEY` | Installation | generated (a copy lives in the registry, or the Tenant loses its Integrations) |
| `SCHEDULED_PUBLICATION_SECRET` | Installation | generated |
| `BOOTSTRAP_SECRET` | Installation | generated, spent at step 7 |
| `MEDIA_STORAGE_DRIVER` | Installation | `local` (or `uploadthing` for the first Installation) |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | **Fleet** | identical everywhere, stable across releases |
| `NODE_ENV` | Fleet | `production` |

Mark the secret values `is_shown_once` so they never come back in API responses.

No other environment variable is per-Tenant. If a value is missing from this table, it belongs in the backoffice, not in the environment.

### 5. Attach the domain

Assign `<domain>` to the application and let Traefik serve it with the wildcard certificate. For the first Installation, custom domain support is exercised here rather than later with a paying customer.

### 6. Deploy and wait for health

Trigger the deployment and poll `GET /deploy?uuid=` (endpoint to confirm) until finished. Then poll `https://<domain>/api/health` until it returns success.

The container migrates its own database at start (`scripts/start-production.sh`, 30 retries over 5 s), so step 2 must not pre-create tables and this step must tolerate a slow database.

### 7. Bootstrap

`POST https://<domain>/api/bootstrap/` with `BOOTSTRAP_SECRET`, a generated admin email and a generated password. The Installation creates the first backoffice user through Better Auth, assigns the admin role, writes `Settings.siteUrl=https://<domain>`, and refuses any further call with that secret.

Never write `User`, `Account` or password hashes from the Control plane: Better Auth hashes with scrypt and owns that policy. See CONTEXT.md, **Bootstrap**.

Record the returned credentials in the registry; the owner changes the password on first login.

### 8. Warm up

GET, ignoring failures: `/`, `/blog/`, `/shop/`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`. This fills the in-memory ISR cache before a real visitor pays the first render.

### 9. Mark ready

`status=ready`, `step=9`, return `https://<domain>/admin/` to the buyer.

## Failure and resume

| Failure | What to do |
| --- | --- |
| Any step fails | `status=failed`, keep the application stopped, keep the database and the volume. Re-run from `step` after the fix. |
| Database exists, application does not | Normal resume: step 2 is a no-op. |
| Application exists, deploy fails | Inspect logs; the database is already migrated or mid-migration. Fix forward, never drop the database to "start clean". |
| Bootstrap called twice | The secret is spent; the second call returns an error. Reset it deliberately by writing a new `BOOTSTRAP_SECRET` and redeploying, not by retrying. |
| Slug reused after deletion | Forbidden by a tombstone row; a deleted slug is not reissued. |

Never automatic: dropping a database, deleting a volume, removing a DNS record. Deletion is a separate, explicit command that renders the Installation and its data unrecoverable.

## Fleet operations

**Release.** Build once in CI, publish `ghcr.io/<org>/spindle:<sha>`, then for each Installation set `image_tag` and redeploy, one at a time, waiting for `/api/health` between them. A failed redeploy stops the rollout; the Fleet is allowed to be on two versions during a rollout, so migrations must be expand/contract.

**Cron.** One timer on the Host (systemd timer or a Coolify scheduled task) calls the Control plane once a minute. The Control plane iterates `status=ready` Installations and POSTs, over the private Docker network, `http://spindle-<slug>:3000/api/scheduler/run/` and `/api/automations/run/` with the Installation's `SCHEDULED_PUBLICATION_SECRET`. No per-Tenant crontab, no public endpoint, no cron-job.org.

Alert if a tick has not completed for ten minutes.

**Backup.** Nightly `pg_dump -Fc -d tenant_<slug>` per Installation plus the media volume, inside the Host's Hetzner automatic backups (daily, seven slots, same provider, no extra service to operate). A dump that never leaves the machine it protects is not a backup: verify a restore into a scratch database before trusting it.

**Updates to this repository** are Fleet-wide; a change that must not reach every Installation at once is not a release, it is a feature flag or it does not ship.

## First Installation (Pictures Writers)

Special case, run once, by hand, in this order:

1. Point the existing site at an Installation created by the runbook above, but with `MEDIA_STORAGE_DRIVER=uploadthing` and the existing `UPLOADTHING_TOKEN`.
2. `pg_dump` the current database and restore it into `tenant_<slug>`, replacing the empty one right after step 6 and before step 7 (the dump already contains the admin user, so Bootstrap is skipped and `Settings.siteUrl` is set by hand in the restored row).
3. Configure the two brand redirects (`/ebooks/*`, `/concorso-tre-colori-2025/`) at the proxy.
4. Keep the current custom domain; this is the first real test of step 5.

The purpose is not migration for its own sake: it is proving the pipeline on a site whose traffic would expose a wrong render before a paying Tenant does.
