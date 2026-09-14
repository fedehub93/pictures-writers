import { DEFAULT_PAGE_SIZE } from "./constants";

export type UsersFilters = {
  search: string;
  page: number;
  roleId: string;
  status: "ACTIVE" | "SUSPENDED" | null;
  sort: "name" | "email" | "createdAt" | "accountStatus";
  direction: "asc" | "desc";
};

export const toUsersInput = (filters: UsersFilters) => ({
  search: filters.search,
  page: filters.page,
  roleId: filters.roleId || undefined,
  accountStatus: filters.status ?? undefined,
  sort: filters.sort,
  direction: filters.direction,
  pageSize: DEFAULT_PAGE_SIZE,
});