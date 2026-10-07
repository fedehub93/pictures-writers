import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";

import { SORT_DIRECTIONS } from "@/shared/lib/list-sorting";

import { DEFAULT_PAGE, PRODUCT_LIST_SORTS, PRODUCT_TYPES } from "../constants";

export const useProductsFilters = () => {
  return useQueryStates({
    search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    page: parseAsInteger
      .withDefault(DEFAULT_PAGE)
      .withOptions({ clearOnDefault: true }),
    status: parseAsStringEnum(["DRAFT", "CHANGED", "PUBLISHED"] as const),
    type: parseAsStringEnum([...PRODUCT_TYPES]),
    category: parseAsString.withOptions({ clearOnDefault: true }),
    sort: parseAsStringEnum([...PRODUCT_LIST_SORTS]),
    direction: parseAsStringEnum([...SORT_DIRECTIONS]),
  });
};
