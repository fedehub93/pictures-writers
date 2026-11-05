/**
 * Puck document stored for a freshly created Site region. The persisted first
 * draft starts empty: the generic fallbacks (a Brand block in the header, a
 * Copyright block in the footer) are supplied by the layout integration when a
 * region has never been published.
 */
export const EMPTY_PUCK_DATA = { root: {}, content: [] };

/**
 * Region keys supported by the data model. Kept in sync with the
 * `SiteRegionKey` Prisma enum, which requires a migration to extend.
 */
export const SITE_REGION_KEYS = ["HEADER", "FOOTER"] as const;

/**
 * Cache tag for the published documents read by the public layout. Publishing
 * or unpublishing a region revalidates this tag together with the layout path,
 * so the short-lived read cache never serves a superseded header or footer.
 */
export const SITE_REGIONS_CACHE_TAG = "site-regions";
