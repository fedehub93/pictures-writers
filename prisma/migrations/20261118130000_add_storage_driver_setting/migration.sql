-- Let the owner choose where new media is stored from the media library.
-- NULL means no choice was saved yet: resolution falls back to the environment
-- (MEDIA_STORAGE_DRIVER) and then to the historical default, so an existing
-- Installation keeps writing exactly where it does today.
ALTER TABLE "Settings" ADD COLUMN "storageDriver" TEXT;
