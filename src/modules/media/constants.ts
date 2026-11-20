export const DEFAULT_PAGE = 1;

/** The library renders eight Media per page; the picker has its own size. */
export const DEFAULT_PAGE_SIZE = 8;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

/**
 * The picker's load size. It is denser than the library page so choosing from
 * a long library costs fewer requests; the two stay separate constants because
 * the library page and the dialog are separate surfaces.
 */
export const MEDIA_PICKER_PAGE_SIZE = 12;

/** The debounce both media search surfaces use before the term is committed. */
export const MEDIA_SEARCH_DEBOUNCE_MS = 500;

/** Which half of the library the admin is looking at. */
export const MEDIA_LIBRARY_VIEWS = ["active", "archived"] as const;

export type MediaLibraryView = (typeof MEDIA_LIBRARY_VIEWS)[number];

export const DEFAULT_MEDIA_VIEW: MediaLibraryView = "active";
