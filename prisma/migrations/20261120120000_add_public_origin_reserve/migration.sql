-- Hold part of the storage quota back for the owner: public-origin files may
-- occupy at most this many megabytes, so a stranger filling a form can never
-- block a library upload. 512 MB is a tenth of the 5 GB default quota, and an
-- Installation with no public forms never reaches it. Existing installations
-- inherit the default without a data migration. Keep this literal equal to
-- PUBLIC_ORIGIN_RESERVE_DEFAULT_MB in src/modules/media/lib/quota.ts.
ALTER TABLE "Settings" ADD COLUMN "publicOriginReserveMb" INTEGER NOT NULL DEFAULT 512;
