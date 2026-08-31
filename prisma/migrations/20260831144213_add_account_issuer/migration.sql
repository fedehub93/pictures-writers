-- Better Auth 1.6 -> 1.7: account identity is now keyed on (issuer, accountId).
-- 1. Add issuer as nullable
ALTER TABLE "Account" ADD COLUMN "issuer" TEXT;

-- 2. Backfill existing rows with deterministic namespaces.
--    Credential (email/password) accounts use the local namespace; external
--    OAuth connections use "local:oauth:" + encodeURIComponent(providerId).
UPDATE "Account" SET "issuer" = 'local:credential' WHERE "providerId" = 'credential';
UPDATE "Account"
  SET "issuer" = 'local:oauth:' || encode(convert_to("providerId", 'UTF8'), 'escape')
  WHERE "providerId" <> 'credential' AND "issuer" IS NULL;

-- Fail loudly instead of silently breaking auth if a row was missed.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Account" WHERE "issuer" IS NULL) THEN
    RAISE EXCEPTION 'Account rows missing issuer backfill; add an explicit namespace for their providerId';
  END IF;
END $$;

-- 3. Make issuer required and enforce the compound unique key.
ALTER TABLE "Account" ALTER COLUMN "issuer" SET NOT NULL;
CREATE UNIQUE INDEX "Account_issuer_accountId_key" ON "Account"("issuer", "accountId");