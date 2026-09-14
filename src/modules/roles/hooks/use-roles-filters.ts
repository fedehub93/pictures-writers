import {
  parseAsInteger,
  useQueryStates,
} from "nuqs";

import { DEFAULT_PAGE } from "../constants";

export const useRolesFilters = () => {
  return useQueryStates({
    page: parseAsInteger
      .withDefault(DEFAULT_PAGE)
      .withOptions({ clearOnDefault: true }),
  });
};