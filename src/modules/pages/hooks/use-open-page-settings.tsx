import { create } from "zustand";

import type { PagesGetMany } from "../types";

type OpenPageSettingsState = {
  data?: PagesGetMany[number];
  isOpen: boolean;
  onOpen: (data?: PagesGetMany[number]) => void;
  onClose: () => void;
};

export const useOpenPageSettings = create<OpenPageSettingsState>((set) => ({
  data: undefined,
  isOpen: false,
  onOpen: (data?: PagesGetMany[number]) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
}));
