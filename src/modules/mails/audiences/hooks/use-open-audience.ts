import { create } from "zustand";
import { AudienceGetOne } from "../types";

type OpenAudienceState = {
  data?: AudienceGetOne;
  isOpen: boolean;
  onOpen: (data?: AudienceGetOne) => void;
  onClose: () => void;
};

export const useOpenAudience = create<OpenAudienceState>((set) => ({
  data: undefined,
  isOpen: false,
  onOpen: (data?: AudienceGetOne) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
}));
