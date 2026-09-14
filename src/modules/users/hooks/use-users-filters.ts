import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";

import { DEFAULT_PAGE } from "../constants";

export const useUsersFilters = () => {
  return useQueryStates({
    search: parseAsString
      .withDefault("")
      .withOptions({ clearOnDefault: true }),
    page: parseAsInteger
      .withDefault(DEFAULT_PAGE)
      .withOptions({ clearOnDefault: true }),
    roleId: parseAsString
      .withDefault("")
      .withOptions({ clearOnDefault: true }),
    status: parseAsStringEnum(["ACTIVE", "SUSPENDED"] as const),
    sort: parseAsStringEnum(
      ["name", "email", "createdAt", "accountStatus"] as const,
    ).withDefault("createdAt"),
    direction: parseAsStringEnum(["asc", "desc"] as const).withDefault("desc"),
  });
};
