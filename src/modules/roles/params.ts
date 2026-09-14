import {
  createLoader,
  parseAsInteger,
} from "nuqs/server";

import { DEFAULT_PAGE } from "./constants";

export const filtersSearchParams = {
  page: parseAsInteger
    .withDefault(DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
};

export const loadSearchParams = createLoader(filtersSearchParams);