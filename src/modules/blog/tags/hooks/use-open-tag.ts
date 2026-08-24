import { create } from "zustand";
import type { TagGetOne } from "../types";

type OpenTagStatus = {
  data?: TagGetOne;
  isOpen: boolean;
  onOpen: (data?: TagGetOne) => void;
  onClose: () => void;
};

export const useOpenTag = create<OpenTagStatus>((set) => ({
  data: undefined,
  isOpen: false,
  onOpen: (data?: TagGetOne) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
}));
