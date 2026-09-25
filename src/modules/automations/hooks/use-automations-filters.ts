import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";

import { AutomationStatus } from "@/generated/prisma";

import { DEFAULT_PAGE } from "../constants";

export const useAutomationsFilters = () => {
  return useQueryStates({
    search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    page: parseAsInteger
      .withDefault(DEFAULT_PAGE)
      .withOptions({ clearOnDefault: true }),
    status: parseAsStringEnum([
      AutomationStatus.DRAFT,
      AutomationStatus.PUBLISHED,
    ] as const),
  });
};