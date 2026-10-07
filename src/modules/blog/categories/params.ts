import {
  createLoader,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { SORT_DIRECTIONS } from "@/shared/lib/list-sorting";

import { CATEGORY_LIST_SORTS, DEFAULT_PAGE } from "./constants";

export const filtersSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  page: parseAsInteger
    .withDefault(DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  status: parseAsStringEnum(["DRAFT", "CHANGED", "PUBLISHED"] as const),
  sort: parseAsStringEnum([...CATEGORY_LIST_SORTS]),
  direction: parseAsStringEnum([...SORT_DIRECTIONS]),
};

export const loadSearchParams = createLoader(filtersSearchParams);
