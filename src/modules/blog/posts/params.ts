import {
  createLoader,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { DEFAULT_PAGE } from "./constants";

export const filtersSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  page: parseAsInteger
    .withDefault(DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  status: parseAsStringEnum(
    ["DRAFT", "CHANGED", "PUBLISHED", "SCHEDULED"] as const,
  ),
};

export const loadSearchParams = createLoader(filtersSearchParams);
