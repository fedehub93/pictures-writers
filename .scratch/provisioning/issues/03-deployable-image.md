# 03 — A deployable image

Status: ready-for-agent
Blocked by: —

## Problem

There is no Dockerfile, no `output: "standalone"`, and the deployment relies on Nixpacks installing dev dependencies so that `npx prisma migrate deploy` works at container start.

## What

- `output: "standalone"` in `next.config.mjs`.
- A `Dockerfile` based on the draft in `docs/self-hosting/appendice-b-dockerfile.md`, pinned to the Node version in `.nvmrc`, ARM64.
- Ship the Prisma CLI and `prisma/migrations` into the runtime stage; either copy `prisma` and `@prisma/engines` from the builder or promote `prisma` to a production dependency. Document which.
- Keep `scripts/start-production.sh` as the entrypoint (retrying migrations then `next start`).
- Tag by commit; publish to `ghcr.io/<org>/spindle:<sha>`.
- Keep `outputFileTracingIncludes` for the Prisma binary.

## Done when

- `docker run` against an empty PostgreSQL container migrates it and serves `/api/health`.
- The same image against a copy of the production database serves the site unchanged.
- Image size and cold start are recorded in the ticket.

## Production impact

Changes how the app is deployed, not what it does. Validate against a database copy before switching the live app off Nixpacks.
