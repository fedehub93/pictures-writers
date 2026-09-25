import { create } from "zustand";

import type { AutomationsGetMany } from "../types";

type AutomationItem = AutomationsGetMany["items"][number];

type OpenAutomationStatus = {
  data?: Partial<AutomationItem>;
  isOpen: boolean;
  onOpen: (data?: Partial<AutomationItem>) => void;
  onClose: () => void;
};

export const useOpenAutomation = create<OpenAutomationStatus>((set) => ({
  data: undefined,
  isOpen: false,
  onOpen: (data?: Partial<AutomationItem>) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
}));