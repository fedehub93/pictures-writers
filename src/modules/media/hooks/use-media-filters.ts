import { useQueryStates } from "nuqs";

import { mediaSearchParams } from "../lib/media-search-params";

/**
 * The library's URL state: what the editor is looking at, never how many blocks
 * have been loaded. Loading another block is query state.
 */
export const useMediaFilters = () => useQueryStates(mediaSearchParams);
