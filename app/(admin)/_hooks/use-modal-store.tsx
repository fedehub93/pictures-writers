import { create } from "zustand";

export type ModalType = "insertLink";

interface ModalStore {
  type: ModalType | null;
  isOpen: boolean;
  data: any;
  setData: any;
  onOpen: (type: ModalType, data: any, setData: any) => void;
  onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  isOpen: false,
  data: {},
  setData: () => {},
  onOpen: (type, data, setData) => set({ isOpen: true, type, data, setData }),
  onClose: () => set({ type: null, isOpen: false }),
}));
