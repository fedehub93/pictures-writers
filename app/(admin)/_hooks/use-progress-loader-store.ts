import { create } from "zustand";

interface ProgressLoaderStore {
  isOpen: boolean;
  onOpen: (data?: any) => void;
  setData: (data?: any) => void;
  onClose: () => void;
  data: any;
}

export const useProgressLoader = create<ProgressLoaderStore>((set) => ({
  type: null,
  isOpen: false,
  onOpen: (data) => set({ isOpen: true, data }),
  setData: (data) => set({ data }),
  onClose: () => set({ isOpen: false }),
  data: {},
}));
