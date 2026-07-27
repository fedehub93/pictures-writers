import { create } from "zustand";
import { PageGetOne } from "../types";

type OpenPageState = {
  data?: PageGetOne;
  isOpen: boolean;
  onOpen: (data?: PageGetOne) => void;
  onClose: () => void;
};

export const useOpenPage = create<OpenPageState>((set) => ({
  data: undefined,
  isOpen: false,
  onOpen: (data?: PageGetOne) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
}));
