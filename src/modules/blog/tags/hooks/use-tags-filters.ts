import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";

import { SORT_DIRECTIONS } from "@/shared/lib/list-sorting";

import { DEFAULT_PAGE, TAG_LIST_SORTS } from "../constants";

export const useTagsFilters = () => {
  return useQueryStates({
    search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    page: parseAsInteger
      .withDefault(DEFAULT_PAGE)
      .withOptions({ clearOnDefault: true }),
    sort: parseAsStringEnum([...TAG_LIST_SORTS]),
    direction: parseAsStringEnum([...SORT_DIRECTIONS]),
  });
};
