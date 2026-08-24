import { create } from "zustand";
import type { CategoryGetOne } from "../types";

type OpenCategoryStatus = {
  data?: CategoryGetOne;
  isOpen: boolean;
  onOpen: (data?: CategoryGetOne) => void;
  onClose: () => void;
};

export const useOpenCategory = create<OpenCategoryStatus>((set) => ({
  data: undefined,
  isOpen: false,
  onOpen: (data?: CategoryGetOne) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
}));
