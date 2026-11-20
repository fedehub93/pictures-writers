import {
  createLoader,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import {
  DEFAULT_MEDIA_VIEW,
  DEFAULT_PAGE,
  MEDIA_LIBRARY_VIEWS,
} from "./constants";

export const mediaSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  page: parseAsInteger
    .withDefault(DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  view: parseAsStringEnum([...MEDIA_LIBRARY_VIEWS])
    .withDefault(DEFAULT_MEDIA_VIEW)
    .withOptions({ clearOnDefault: true }),
};

export const loadMediaSearchParams = createLoader(mediaSearchParams);
