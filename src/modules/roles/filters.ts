import { DEFAULT_PAGE_SIZE } from "./constants";

export type RolesFilters = {
  page: number;
};

export const toRolesInput = (filters: RolesFilters) => ({
  page: filters.page,
  pageSize: DEFAULT_PAGE_SIZE,
});