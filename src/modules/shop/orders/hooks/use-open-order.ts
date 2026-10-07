import { create } from "zustand";

type OpenOrderState = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useOpenOrder = create<OpenOrderState>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
