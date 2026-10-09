import { create } from "zustand";

import type { ProductListItem } from "../types";

type OpenProductState = {
  data?: ProductListItem;
  isOpen: boolean;
  onOpen: (data?: ProductListItem) => void;
  onClose: () => void;
};

export const useOpenProduct = create<OpenProductState>((set) => ({
  data: undefined,
  isOpen: false,
  onOpen: (data?: ProductListItem) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
}));
