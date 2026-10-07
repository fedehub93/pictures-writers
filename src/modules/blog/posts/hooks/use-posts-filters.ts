import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";

import { SORT_DIRECTIONS } from "@/shared/lib/list-sorting";

import { DEFAULT_PAGE, POST_LIST_SORTS } from "../constants";

export const usePostsFilters = () => {
  return useQueryStates({
    search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    page: parseAsInteger
      .withDefault(DEFAULT_PAGE)
      .withOptions({ clearOnDefault: true }),
    status: parseAsStringEnum(
      ["DRAFT", "CHANGED", "PUBLISHED", "SCHEDULED"] as const,
    ),
    sort: parseAsStringEnum([...POST_LIST_SORTS]),
    direction: parseAsStringEnum([...SORT_DIRECTIONS]),
  });
};
