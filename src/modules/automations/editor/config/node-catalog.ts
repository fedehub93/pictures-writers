import {
  catalogByCategory,
  coreNodeCatalog,
  mergeNodeCatalog,
  type AutomationNodeCatalogEntry,
} from "@/modules/automations/lib/node-catalog";
import { formSubmittedTriggerCatalogEntry } from "@/modules/forms/automations/catalog";
import { sendEmailNodeCatalogEntry } from "@/modules/mails/automations/catalog";

/**
 * The palette contents: engine nodes plus the nodes feature modules
 * contribute. Adding a module node here is the only editor change it needs.
 */
export const editorNodeCatalog: AutomationNodeCatalogEntry[] = mergeNodeCatalog(
  coreNodeCatalog,
  [sendEmailNodeCatalogEntry, formSubmittedTriggerCatalogEntry],
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
