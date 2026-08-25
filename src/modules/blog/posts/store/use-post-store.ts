// store/use-editor-status.ts
import { create } from "zustand";

export type PostStatus =
  | "no_change"
  | "edited"
  | "saving"
  | "saved"
  | "publishing"
  | "published";

interface PostStoreState {
  status: PostStatus;
  setStatus: (status: PostStatus) => void;
  reset: () => void;
}

export const usePostStore = create<PostStoreState>((set) => ({
  status: "no_change",
  setStatus: (status) => set({ status }),
  reset: () => set({ status: "no_change" }),
}));
