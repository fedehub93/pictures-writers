import {
  parseAsString,
  useQueryStates,
} from "nuqs";

export const CALENDAR_FILTER_ALL = "all";

export const useCalendarFilters = () => {
  return useQueryStates({
    actionType: parseAsString.withDefault(CALENDAR_FILTER_ALL),
    status: parseAsString.withDefault(CALENDAR_FILTER_ALL),
  });
};