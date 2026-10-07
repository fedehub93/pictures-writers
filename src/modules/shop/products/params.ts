import {
  createLoader,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { DEFAULT_PAGE, PRODUCT_TYPES } from "./constants";

export const filtersSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  page: parseAsInteger
    .withDefault(DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  status: parseAsStringEnum(["DRAFT", "CHANGED", "PUBLISHED"] as const),
  type: parseAsStringEnum([...PRODUCT_TYPES]),
  category: parseAsString.withOptions({ clearOnDefault: true }),
};

export const loadSearchParams = createLoader(filtersSearchParams);
