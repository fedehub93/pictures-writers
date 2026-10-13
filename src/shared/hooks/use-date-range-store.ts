import { create } from "zustand";
import { DateRange } from "react-day-picker";
import { addMonths, startOfMonth, endOfMonth } from "date-fns";

interface DateRangeState {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  resetDateRange: () => void;
}

/**
 * The analytics default range: the trailing six full calendar months, through
 * the end of last month. Six months keeps the Trend charts multi-month by
 * default while excluding the in-progress current month.
 */
export const defaultDateRange = (): DateRange => ({
  from: startOfMonth(addMonths(new Date(), -6)),
  to: endOfMonth(addMonths(new Date(), -1)),
});

export const useDateRangeStore = create<DateRangeState>((set) => ({
  dateRange: defaultDateRange(),
  setDateRange: (range) => set({ dateRange: range }),
  resetDateRange: () => set({ dateRange: defaultDateRange() }),
}));
