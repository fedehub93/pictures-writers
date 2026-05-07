import { create } from "zustand";

type OpenPageState = {
  id?: string;
  isOpen: boolean;
  onOpen: (id?: string) => void;
  onClose: () => void;
};

export const useOpenPage = create<OpenPageState>((set) => ({
  id: undefined,
  isOpen: false,
  onOpen: (id?: string) => set({ isOpen: true, id }),
  onClose: () => set({ isOpen: false, id: undefined }),
}));
