-- One role row per stored file: an Attachment is owned by exactly one message
-- or form submission, and an Avatar is owned by one user. The bytes, address,
-- content type and size live on StoredFile, so the role carries no copy.
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "emailMessageId" TEXT,
    "formSubmissionId" TEXT,
    "filename" TEXT NOT NULL,
    "externalId" TEXT,
    "storedFileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Attachment_storedFileId_key" ON "Attachment"("storedFileId");
CREATE INDEX "Attachment_emailMessageId_idx" ON "Attachment"("emailMessageId");
CREATE INDEX "Attachment_formSubmissionId_idx" ON "Attachment"("formSubmissionId");

ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_emailMessageId_fkey" FOREIGN KEY ("emailMessageId") REFERENCES "EmailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_formSubmissionId_fkey" FOREIGN KEY ("formSubmissionId") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_storedFileId_fkey" FOREIGN KEY ("storedFileId") REFERENCES "StoredFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Exactly one owner. A row with both or neither would have no lifecycle.
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_owner_check" CHECK (
    (("emailMessageId" IS NOT NULL)::int + ("formSubmissionId" IS NOT NULL)::int) = 1
);

-- The avatar owner is recorded on the file. `SetNull` rather than `Cascade`:
-- if the objects cannot be removed through their recorded driver, the record
-- must survive so the audit can report it instead of losing where it lives.
ALTER TABLE "StoredFile" ADD COLUMN "avatarOwnerId" TEXT;
CREATE UNIQUE INDEX "StoredFile_avatarOwnerId_key" ON "StoredFile"("avatarOwnerId");
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_avatarOwnerId_fkey" FOREIGN KEY ("avatarOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Copy the legacy provider attachments into the new role. Their bytes stay
-- where they are. An UploadThing address keeps the provider's own file key, so
-- a later deletion still removes the exact object; a canonical `/files/<key>`
-- address keeps its key; any other address becomes a remote location recorded
-- against an `external` driver, which the audit reports rather than guessing
-- how to delete it. The old table is left in place so a rolling deploy's
-- previous container keeps working until the provider attachment path is
-- retired.
WITH legacy AS (
    SELECT
        "id",
        "emailMessageId",
        "filename",
        "externalId",
        "url",
        "contentType",
        "size",
        "createdAt",
        "updatedAt",
        CASE
            WHEN "url" LIKE '/files/%' THEN substring("url" FROM 8)
            WHEN "url" ~* '^https?://[^/]+/f/' THEN
                regexp_replace(split_part("url", '?', 1), '^https?://[^/]+/f/', '')
            ELSE 'default/' || "id" || '/1/' || COALESCE(
                NULLIF(regexp_replace("filename", '[^A-Za-z0-9._-]', '_', 'g'), ''),
                'file'
            )
        END AS "storageKey",
        CASE
            WHEN "url" LIKE '/files/%' THEN 'local'
            WHEN "url" ~* '^https?://[^/]+/f/' THEN 'uploadthing'
            ELSE 'external'
        END AS "driver",
        CASE
            WHEN "url" LIKE '/files/%' THEN NULL
            ELSE "url"
        END AS "remoteUrl"
    FROM "EmailAttachment"
)
INSERT INTO "StoredFile" (
    "id", "key", "driver", "remoteUrl", "contentType", "size", "checksum",
    "kind", "origin", "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    "storageKey",
    "driver",
    "remoteUrl",
    "contentType",
    "size",
    NULL,
    'ATTACHMENT',
    'INTERNAL',
    "createdAt",
    "updatedAt"
FROM legacy
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "Attachment" (
    "id", "emailMessageId", "filename", "externalId", "storedFileId",
    "createdAt", "updatedAt"
)
SELECT
    legacy."id",
    legacy."emailMessageId",
    legacy."filename",
    legacy."externalId",
    stored."id",
    legacy."createdAt",
    legacy."updatedAt"
FROM "EmailAttachment" legacy
JOIN "StoredFile" stored ON stored."key" = (
    CASE
        WHEN legacy."url" LIKE '/files/%' THEN substring(legacy."url" FROM 8)
        WHEN legacy."url" ~* '^https?://[^/]+/f/' THEN
            regexp_replace(split_part(legacy."url", '?', 1), '^https?://[^/]+/f/', '')
        ELSE 'default/' || legacy."id" || '/1/' || COALESCE(
            NULLIF(regexp_replace(legacy."filename", '[^A-Za-z0-9._-]', '_', 'g'), ''),
            'file'
        )
    END
)
ON CONFLICT DO NOTHING;
