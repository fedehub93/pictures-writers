-- Strip a restored production dump of the rows that make it a credential store.
--
-- Run it against the development database right after a restore and before any session — human
-- or agent — opens it:
--
--   Get-Content scripts/sanitize-dev-dump.sql | npm run -s dev:db:psql
--
-- What goes: session tokens (better-auth stores them in clear, so a dump plus a shared
-- BETTER_AUTH_SECRET yields a live cookie), pending verification tokens, and the encrypted
-- integration and automation credentials. What stays: users, accounts and content, so the local
-- app still renders and still logs in.
--
-- This removes the tokens, not the key that signs them. The companion rule lives in AGENTS.md:
-- development never copies production environment values.

BEGIN;

DELETE FROM "Session";
DELETE FROM "Verification";
DELETE FROM "Credential";
DELETE FROM "Integration";

COMMIT;
