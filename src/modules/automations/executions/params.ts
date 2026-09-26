import {
  createLoader,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { AUTOMATION_RUN_STATUSES, DEFAULT_PAGE } from "../constants";

export const runFiltersSearchParams = {
  status: parseAsStringEnum([...AUTOMATION_RUN_STATUSES]),
  from: parseAsString,
  to: parseAsString,
  page: parseAsInteger
    .withDefault(DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
};

export const loadRunSearchParams = createLoader(runFiltersSearchParams);
