import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";

import { SORT_DIRECTIONS } from "@/shared/lib/list-sorting";

import { CATEGORY_LIST_SORTS, DEFAULT_PAGE } from "../constants";

export const useCategoriesFilters = () => {
  return useQueryStates({
    search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    page: parseAsInteger
      .withDefault(DEFAULT_PAGE)
      .withOptions({ clearOnDefault: true }),
    sort: parseAsStringEnum([...CATEGORY_LIST_SORTS]),
    direction: parseAsStringEnum([...SORT_DIRECTIONS]),
  });
};
