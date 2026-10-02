import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

import { DEFAULT_PAGE } from "../constants";
import { ORDER_STATUSES } from "../schemas";

export const useOrderFilters = () => {
  return useQueryStates({
    search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    status: parseAsStringLiteral(ORDER_STATUSES).withOptions({
      clearOnDefault: true,
    }),
    page: parseAsInteger
      .withDefault(DEFAULT_PAGE)
      .withOptions({ clearOnDefault: true }),
  });
};
