# 07 — Rename to Spindle CMS and remove dead weight

Status: ready-for-agent
Blocked by: —

## Problem

The repository is still named after its first customer, and carries leftovers that mislead the next reader.

## What

- Rename: `package.json` name, `README.md`, `AGENTS.md`, the test database name in `docker-compose.yml`, and the image name in the docs. Product name is **Spindle CMS** (working name), domain `spindlecms.com`.
- Remove `bcryptjs` from dependencies: nothing in `src/` imports it, and Better Auth hashes with scrypt.
- Remove `.vercel/`.
- Remove `Settings.deployWebhookUrl`: editable in the backoffice, read by nothing.
- Move `docs/marketing/**` out of the product repository: it is the first customer's marketing, not the product's.
- Keep `docs/self-hosting/**` and the ADRs; they are the product's operational history even where they mention the old name.

## Done when

- `npm run lint`, `npm run build` and `npm run test:run` pass.
- No leftover reference to the old package name outside historical documents.
- The dependency tree no longer contains a hashing library the app does not use.

## Production impact

None at runtime. Safe to merge at any point.
