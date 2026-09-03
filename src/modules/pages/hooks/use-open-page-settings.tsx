import { create } from "zustand";

import type { PagesGetMany } from "../types";

type OpenPageSettingsState = {
  data?: PagesGetMany["items"][number];
  isOpen: boolean;
  onOpen: (data?: PagesGetMany["items"][number]) => void;
  onClose: () => void;
};

export const useOpenPageSettings = create<OpenPageSettingsState>((set) => ({
  data: undefined,
  isOpen: false,
  onOpen: (data?: PagesGetMany["items"][number]) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
}));
