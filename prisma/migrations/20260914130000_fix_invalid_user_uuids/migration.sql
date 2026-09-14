-- Reassign valid UUID ids to users whose id is not a UUID (e.g. manually imported rows).
-- Idempotent: no-op if every user already has a valid UUID id.
-- FKs referencing "User" use ON UPDATE CASCADE, so child rows follow automatically.
-- Two locations do NOT have an FK and must be updated explicitly from the old->new map:
--   * "AdministrativeActivity"."targetId" is a free-text column (no FK)
--   * "Product"."metadata" -> author.id is a denormalized JSONB copy of the author user id

CREATE TEMP TABLE "_tmp_user_id_map" (
    "oldId" TEXT PRIMARY KEY,
    "newId" TEXT
);

INSERT INTO "_tmp_user_id_map" ("oldId", "newId")
SELECT "id", gen_random_uuid()::text
FROM "User"
WHERE "id" !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

UPDATE "User" AS u
SET "id" = m."newId",
    "email" = btrim(u."email")
FROM "_tmp_user_id_map" AS m
WHERE u."id" = m."oldId";

UPDATE "AdministrativeActivity" AS aa
SET "targetId" = m."newId"
FROM "_tmp_user_id_map" AS m
WHERE aa."targetType" = 'USER'
  AND aa."targetId" = m."oldId";

UPDATE "Product" AS p
SET "metadata" = jsonb_set(
        p."metadata",
        '{author,id}',
        to_jsonb(m."newId")
    )
FROM "_tmp_user_id_map" AS m
WHERE p."metadata"->'author'->>'id' = m."oldId";

DROP TABLE "_tmp_user_id_map";