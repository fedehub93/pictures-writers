import { create } from "zustand";

export type ModalType = "createMediaAsset" | "selectAsset";

interface ModalStore {
  type: ModalType | null;
  isOpen: boolean;
  onOpen: (type: ModalType, onCallback?: (data: any) => any) => void;
  onClose: () => void;
  data: any;
  setData: (data: any) => void;
  onCallback: (data: any) => any;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  isOpen: false,
  onOpen: (type, onCallback) => set({ isOpen: true, type, onCallback }),
  onClose: () => set({ type: null, isOpen: false }),
  data: {},
  setData: (data) => set({ data: { data } }),
  onCallback: (data) => data,
}));
