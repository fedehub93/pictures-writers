-- Give every Installation a media quota, in megabytes, over originals plus
-- generated renditions and including archived Media. The default is 5 GB and
-- existing installations inherit it without a data migration.
ALTER TABLE "Settings" ADD COLUMN "mediaQuotaMb" INTEGER NOT NULL DEFAULT 5120;
