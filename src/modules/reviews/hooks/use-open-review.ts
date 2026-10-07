import { create } from "zustand";

import { ReviewsGetMany } from "../types";

export type ReviewListItem = ReviewsGetMany["items"][number];

type OpenReviewState = {
  data?: ReviewListItem;
  isOpen: boolean;
  onOpen: (data?: ReviewListItem) => void;
  onClose: () => void;
};

export const useOpenReview = create<OpenReviewState>((set) => ({
  data: undefined,
  isOpen: false,
  onOpen: (data?: ReviewListItem) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
}));
