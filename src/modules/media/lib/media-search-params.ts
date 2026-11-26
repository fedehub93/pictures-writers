import { parseAsString, parseAsStringEnum } from "nuqs/server";

import {
  DEFAULT_MEDIA_SORT,
  DEFAULT_MEDIA_VIEW,
  MEDIA_LIBRARY_SORTS,
  MEDIA_LIBRARY_VIEWS,
} from "../constants";

/**
 * The library's URL contract, shared by the server loader and the client's
 * `useQueryStates` so the two cannot disagree. It names the scope only: loaded
 * blocks are query state, and a legacy `page` parameter is simply not read.
 */
export const mediaSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  view: parseAsStringEnum([...MEDIA_LIBRARY_VIEWS])
    .withDefault(DEFAULT_MEDIA_VIEW)
    .withOptions({ clearOnDefault: true }),
  folderId: parseAsString.withOptions({ clearOnDefault: true }),
  sort: parseAsStringEnum([...MEDIA_LIBRARY_SORTS])
    .withDefault(DEFAULT_MEDIA_SORT)
    .withOptions({ clearOnDefault: true }),
};
