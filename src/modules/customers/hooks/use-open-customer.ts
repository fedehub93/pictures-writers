import { create } from "zustand";

import { CustomersGetMany } from "../types";

export type CustomerListItem = CustomersGetMany["items"][number];

type OpenCustomerState = {
  data?: CustomerListItem;
  isOpen: boolean;
  onOpen: (data?: CustomerListItem) => void;
  onClose: () => void;
};

export const useOpenCustomer = create<OpenCustomerState>((set) => ({
  data: undefined,
  isOpen: false,
  onOpen: (data?: CustomerListItem) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
}));
