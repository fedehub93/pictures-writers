import { create } from "zustand";

export type ModalType =
  | "createMediaAsset"
  | "editMediaAsset"
  | "selectAsset"
  | "selectPost"
  | "selectProduct"
  | "selectUrl"
  | "createUser"
  | "editUser"
  | "editLink"
  | "importAudienceContacts"
  | "createAdBlock"
  | "createAdItem";

interface ModalStore {
  type: ModalType | null;
  isOpen: boolean;
  onOpen: (
    type: ModalType,
    onCallback?: (data: any) => any,
    data?: any
  ) => void;
  onClose: () => void;
  data: any;
  onCallback: (data: any) => any;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  isOpen: false,
  onOpen: (type, onCallback, data) =>
    set({ isOpen: true, type, onCallback, data }),
  onClose: () => set({ type: null, isOpen: false }),
  data: {},
  onCallback: (data) => data,
}));
