import { create } from "zustand";
import { DateRange } from "react-day-picker";
import { addMonths, startOfMonth, endOfMonth } from "date-fns";

interface DateRangeState {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  resetDateRange: () => void;
}

const initialFrom = startOfMonth(addMonths(new Date(), -1));
const initialTo = endOfMonth(addMonths(new Date(), -1));

export const useDateRangeStore = create<DateRangeState>((set) => ({
  dateRange: { from: initialFrom, to: initialTo },
  setDateRange: (range) => set({ dateRange: range }),
  resetDateRange: () =>
    set({
      dateRange: { from: initialFrom, to: initialTo },
    }),
}));
