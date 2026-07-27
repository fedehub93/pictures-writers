import { create } from "zustand";
import { FormGetOne } from "../types";

type OpenFormState = {
  data?: FormGetOne;
  isOpen: boolean;
  onOpen: (data?: FormGetOne) => void;
  onClose: () => void;
};

export const useOpenForm = create<OpenFormState>((set) => ({
  data: undefined,
  isOpen: false,
  onOpen: (data?: FormGetOne) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
}));
