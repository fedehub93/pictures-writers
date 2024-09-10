import { create } from "zustand";

export type SheetType = "editContentImage";

interface SheetStore {
  type: SheetType | null;
  isOpen: boolean;
  onOpen: (
    type: SheetType,
    onCallback?: (data: any) => any,
    data?: any
  ) => void;
  onClose: () => void;
  data: any;
  onCallback: (data: any) => any;
}

export const useSheet = create<SheetStore>((set) => ({
  type: null,
  isOpen: false,
  onOpen: (type, onCallback, data) =>
    set({ isOpen: true, type, onCallback, data }),
  onClose: () => set({ type: null, isOpen: false }),
  data: {},
  onCallback: (data) => data,
}));
