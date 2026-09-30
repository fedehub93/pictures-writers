import { create } from "zustand";

import type { CredentialGetOne } from "../types";

type OpenCredentialStatus = {
  data?: CredentialGetOne;
  isOpen: boolean;
  onOpen: (data?: CredentialGetOne) => void;
  onClose: () => void;
};

export const useOpenCredential = create<OpenCredentialStatus>((set) => ({
  data: undefined,
  isOpen: false,
  onOpen: (data?: CredentialGetOne) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
}));
