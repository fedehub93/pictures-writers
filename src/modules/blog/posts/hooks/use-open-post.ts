import { create } from "zustand";
import type { PostGetOne } from "../types";

type OpenPostStatus = {
  data?: Partial<PostGetOne>;
  isOpen: boolean;
  onOpen: (data?: Partial<PostGetOne>) => void;
  onClose: () => void;
};

export const useOpenPost = create<OpenPostStatus>((set) => ({
  data: undefined,
  isOpen: false,
  onOpen: (data?: Partial<PostGetOne>) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
}));
