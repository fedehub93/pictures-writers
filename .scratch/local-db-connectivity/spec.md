---
Status: done
Type: spec
---

# Local database connectivity

## Problem Statement

`npm run build` could hang forever, with no error and zero CPU, at `Collecting page data`. The same failure hit any Node process that opened a connection to the development database.

Three failures stacked:

1. **The listener.** `docker-compose.yml` and `docker-compose.dev.yml` published the database ports with a bare `"5434:5432"`, which makes Docker listen on both `0.0.0.0:5434` and `[::]:5434`. Docker Desktop on Windows can accept connections on the IPv6 listener without ever forwarding them: the TCP handshake succeeds, no Postgres backend is created, and the client waits on a half-open socket. Node resolves `localhost` to `::1` first and picks it (Happy Eyeballs), so the application reliably takes the broken path.
2. **The client.** `src/lib/db.ts` and `src/shared/lib/db.ts` constructed the Prisma adapter with only a connection string, so `pg` had no connect timeout. A connection that is accepted but never answered never settles: the first query stays pending, and any caller — a build worker, the dev server, a script — hangs rather than failing.
3. **The connection budget.** A build prerenders one worker per CPU, every worker imports both `db.ts` modules, and `pg`'s default pool is 10 connections. With 19 workers the build asked for roughly 380 connections against a server that allows 100, and died with P2037 as soon as the hang was out of the way.

Measured before the fix: 30 parallel connections to `127.0.0.1:5434` succeeded in 58 ms; 30 to `[::1]:5434` all timed out at 8 s.

## Solution

Four narrow changes, each closing one failure.

- **Loopback, IPv4 only.** Publish `127.0.0.1:5434:5432` and `127.0.0.1:5433:5432`. With no IPv6 listener the connection is refused immediately, Node falls back to IPv4, and `localhost` keeps working with no per-developer `.env` edit. Side benefit: the databases stop being reachable from the local network.
- **A connect timeout.** `connectionTimeoutMillis: 5_000` on both adapters, matching the connect timeout of Prisma's own engine. A black-holed connection now becomes an explicit error with a stack instead of a silent hang.
- **Small pools.** `max: 4` on both adapters. `next build` prerenders one worker per CPU and every worker imports both `db.ts` modules, so `pg`'s default of 10 connections per pool asks for roughly 2 × CPU count × 10 connections — 380 with 19 workers — and the build died with P2037 even after the server limit was raised. Four keeps a 19-worker build around 152 connections and still leaves a server process a pool of eight.
- **Enough connections for a build.** The dev container's `max_connections` is 100 by default, so the compose file starts Postgres with `-c max_connections=200`. This is the ceiling the small pools have to fit under; raising it alone was not enough.

## Verification

- `localhost:5434` connects in 20 ms; `[::1]:5434` is refused in 0 ms. Same for the test database on `5433`.
- `npm run build` completes with an unmodified `.env` (that is, with `localhost`): compiled, page data collected, 382/382 static pages, no P2037 and no stall. This is the end-to-end proof that the documented developer workflow works as written.
- A regression test in `src/shared/lib/__tests__/db-connection-timeout.test.ts` accepts a socket and never answers it, then asserts the query rejects within the timeout. Removing `connectionTimeoutMillis` makes that test hit the 30 s test timeout — checked, not assumed.
- `npx tsc --noEmit`, `npm run test:run` and `npm run lint` on the touched files.

## Out of scope

- Merging `src/lib/db.ts` and `src/shared/lib/db.ts`. The duplication is pre-existing (the same shape as the two `auth.ts` files); the pool cap has to account for it, but untangling it is not this fix.
- CI: the workflows provision Postgres as a service container and never use these compose files.
