export const DEFAULT_PAGE = 1;

/**
 * The library page already renders eight Media per page; the refactor keeps
 * that number rather than making the admin work in a different batch size.
 */
export const DEFAULT_PAGE_SIZE = 8;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

/** Which half of the library the admin is looking at. */
export const MEDIA_LIBRARY_VIEWS = ["active", "archived"] as const;

export type MediaLibraryView = (typeof MEDIA_LIBRARY_VIEWS)[number];

export const DEFAULT_MEDIA_VIEW: MediaLibraryView = "active";
