import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";

import { DEFAULT_PAGE } from "../constants";

export const useReviewsFilters = () => {
  return useQueryStates({
    search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    page: parseAsInteger
      .withDefault(DEFAULT_PAGE)
      .withOptions({ clearOnDefault: true }),
    status: parseAsBoolean.withOptions({ clearOnDefault: true }),
    product: parseAsString.withOptions({ clearOnDefault: true }),
  });
};
