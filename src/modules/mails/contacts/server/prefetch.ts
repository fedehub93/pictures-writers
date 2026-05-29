import { prefetch, trpc } from "@/trpc/server";

import { ContactsGetManyInput, ContactsGrowthInput } from "../types";

/**
 * Prefetch all Contacts
 */
export const prefetchContacts = (params: ContactsGetManyInput) => {
  return prefetch(trpc.contacts.getMany.queryOptions(params));
};

/**
 * Prefetch Contacts growth
 */
export const prefetchContactsGrowth = (params: ContactsGrowthInput) => {
  return prefetch(trpc.contacts.getContactsGrowth.queryOptions(params));
};
