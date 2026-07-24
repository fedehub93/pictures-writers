import {
  createLoader,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import { DEFAULT_PAGE } from "./constants";
import { ContentStatus } from "@/generated/prisma";

export const filtersSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  page: parseAsInteger
    .withDefault(DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  status: parseAsStringEnum(Object.values(ContentStatus)),
};

export const loadSearchParams = createLoader(filtersSearchParams);
