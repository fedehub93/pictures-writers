import { create } from "zustand";

import type { ProductCategoryGetOne } from "../types";

type OpenProductCategoryState = {
  data?: ProductCategoryGetOne;
  isOpen: boolean;
  onOpen: (data?: ProductCategoryGetOne) => void;
  onClose: () => void;
};

export const useOpenProductCategory = create<OpenProductCategoryState>((set) => ({
  data: undefined,
  isOpen: false,
  onOpen: (data?: ProductCategoryGetOne) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
}));
