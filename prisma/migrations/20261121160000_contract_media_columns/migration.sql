-- The contraction of the storage-location model: the Media stops carrying a
-- copy of the facts its StoredFile record answers. The preceding release no
-- longer reads any of these columns, so the previous container keeps serving
-- through the rolling update while this migration runs.
ALTER TABLE "Media"
  DROP COLUMN "key",
  DROP COLUMN "url",
  DROP COLUMN "size",
  DROP COLUMN "mimeType",
  DROP COLUMN "checksum",
  DROP COLUMN "storageDriver";
