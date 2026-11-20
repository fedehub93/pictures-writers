# Checking a migration before it ships

Reach for this when a migration carries hand-written SQL: a data transform, a backfill, an
expand/contract step that renames or fills a column. `prisma migrate deploy` on the test database
proves the file parses; it does not prove the transform maps real rows, and it runs against a
database that already has every earlier migration applied, so a migration that only works on an
empty table passes.

The check is a scratch database on the **test** container (`localhost:5433`), seeded with the
shape the pre-migration data has, then migrated for real. Never the development container
(`localhost:5434`): it can hold a restored production dump.

## Run it

`psql` reaches the container; the SQL goes in through a pipe. Write the statements to a file
rather than a `-c` argument, so no shell quoting has to survive.

```powershell
# 1. A database that exists for this check and nothing else.
'DROP DATABASE IF EXISTS pictures_writers_migration_check; CREATE DATABASE pictures_writers_migration_check;' |
  docker exec -i pictures-writers-test-db psql -U postgres -d postgres

# 2. Build the pre-migration schema: put the new migration aside, deploy the rest.
Move-Item prisma/migrations/<new> $env:TEMP\<new>
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5433/pictures_writers_migration_check'; npx prisma migrate deploy

# 3. Seed the rows the transform will read, oldest shape first. Parents before children.
Get-Content seed.sql | docker exec -i pictures-writers-test-db psql -U postgres -d pictures_writers_migration_check

# 4. Put the migration back and let Prisma apply it to the seeded state, wrapped as in production.
Move-Item $env:TEMP\<new> prisma/migrations/<new>
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5433/pictures_writers_migration_check'; npx prisma migrate deploy

# 5. Assert what the ticket promises, then drop the database.
Get-Content assert.sql | docker exec -i pictures-writers-test-db psql -U postgres -d pictures_writers_migration_check
'DROP DATABASE IF EXISTS pictures_writers_migration_check;' |
  docker exec -i pictures-writers-test-db psql -U postgres -d postgres
```

On bash the redirection replaces each pipe: `npm run -s dev:db:psql < q.sql` is the development
equivalent; for a scratch database use
`docker exec -i pictures-writers-test-db psql -U postgres -d pictures_writers_migration_check < seed.sql`.

Both `npx prisma migrate deploy` calls read `DATABASE_URL` from the environment, not from `.env`,
so set it in the same shell line. Leaving it set for step 4 also targets the scratch database, not
the test one.

## Traps

- **Put the migration directory back.** Step 2 moves it out and step 4 moves it in; if the check is
  abandoned in between, `git status` shows the file deleted. Restore it before doing anything else.
- **Seeded rows must be legal for the pre-migration schema**, so insert parents first
  (`EmailAccount` → `Conversation` → `EmailMessage` → `EmailAttachment`). A row that only becomes
  legal after the migration cannot be seeded in step 3 — that is the case a transform is usually
  written for, and the two-phase deploy is what exposes it.
- **PowerShell here-strings interpolate.** A `@\"…\"@` block turns `\"key\"` into an escape error;
  use a single-quoted `@'…'@` block or, better, a `.sql` file.
- **The scratch database is disposable; the test database is not.** Keep the two names apart:
  `pictures_writers_migration_check` is dropped at the end, `pictures_writers_test` is what the
  test suite migrates.
- **A rollback is part of the check.** For an expand/contract migration, run the old code against
  the migrated database once (the tests are enough) — the rolling deploy keeps the previous
  container alive while the new one builds.

## What a closed ticket says

A ticket that shipped a transform records the check in its `## Comments`: that the row transform
was exercised against a scratch database, and which address shapes or row states it covered. Vague
claims ("tested locally") are what the check exists to replace.

`.scratch/storage-location/issues/05-attachments-and-avatars.md` is an example: three legacy
address shapes, each asserted after the copy.
