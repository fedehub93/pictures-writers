import { create } from "zustand";
import { EmailAccountGetOne } from "../types";

type OpenEmailAccountState = {
  data?: EmailAccountGetOne;
  isOpen: boolean;
  onOpen: (data?: EmailAccountGetOne) => void;
  onClose: () => void;
};

export const useOpenEmailAccount = create<OpenEmailAccountState>((set) => ({
  data: undefined,
  isOpen: false,
  onOpen: (data?: EmailAccountGetOne) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
}));
