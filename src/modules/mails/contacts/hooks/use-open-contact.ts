import { create } from "zustand";
import { ContactGetOne } from "../types";

type OpenContactState = {
  data?: ContactGetOne;
  isOpen: boolean;
  onOpen: (data?: ContactGetOne) => void;
  onClose: () => void;
};

export const useOpenContact = create<OpenContactState>((set) => ({
  data: undefined,
  isOpen: false,
  onOpen: (data?: ContactGetOne) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
}));
