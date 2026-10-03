import {
  catalogByCategory,
  coreNodeCatalog,
  mergeNodeCatalog,
  type AutomationNodeCatalogEntry,
} from "@/modules/automations/lib/node-catalog";
import { createCustomerNodeCatalogEntry } from "@/modules/customers/automations/catalog";
import { formSubmittedTriggerCatalogEntry } from "@/modules/forms/automations/catalog";
import {
  sendEmailNodeCatalogEntry,
  subscriptionConfirmedTriggerCatalogEntry,
} from "@/modules/mails/automations/catalog";
import {
  createOrderNodeCatalogEntry,
  orderCompletedTriggerCatalogEntry,
} from "@/modules/orders/automations/catalog";

/**
 * The palette contents: engine nodes plus the nodes feature modules
 * contribute. Adding a module node here is the only editor change it needs.
 */
export const editorNodeCatalog: AutomationNodeCatalogEntry[] = mergeNodeCatalog(
  coreNodeCatalog,
  [
    sendEmailNodeCatalogEntry,
    formSubmittedTriggerCatalogEntry,
    subscriptionConfirmedTriggerCatalogEntry,
    createCustomerNodeCatalogEntry,
    createOrderNodeCatalogEntry,
    orderCompletedTriggerCatalogEntry,
  ],
);

export const editorTriggerNodes = catalogByCategory(
  editorNodeCatalog,
  "trigger",
);

export const editorActionNodes = catalogByCategory(editorNodeCatalog, "action");

export function findCatalogEntry(
  type: string | null | undefined,
): AutomationNodeCatalogEntry | undefined {
  return type
    ? editorNodeCatalog.find((entry) => entry.type === type)
    : undefined;
}
