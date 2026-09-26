/**
 * Domain-agnostic catalogue of the nodes the editor can offer.
 *
 * The engine executes nodes from the registry; the catalogue only carries the
 * metadata the palette needs. Feature modules contribute their own entries
 * (e.g. the mails module contributes Send Email) and the editor composes them,
 * so the engine core never learns about domain nodes.
 */
export type AutomationNodeCategory = "trigger" | "action";

export interface AutomationNodeCatalogEntry {
  /** UI node type, e.g. `SEND_EMAIL` (the engine canonicalises it). */
  type: string;
  label: string;
  description: string;
  category: AutomationNodeCategory;
}

/** Nodes contributed by the engine itself. */
export const coreNodeCatalog: AutomationNodeCatalogEntry[] = [
  {
    type: "MANUAL_TRIGGER",
    label: "Trigger manually",
    description:
      "Runs the flow on clicking a button. Good for getting started quickly.",
    category: "trigger",
  },
  {
    type: "CRON_TRIGGER",
    label: "Schedule",
    description: "Runs the flow on a recurring interval.",
    category: "trigger",
  },
  {
    type: "WEBHOOK_TRIGGER",
    label: "Webhook",
    description: "Starts the flow from an authenticated HTTP request.",
    category: "trigger",
  },
  {
    type: "HTTP_REQUEST",
    label: "HTTP Request",
    description: "Makes an HTTP request",
    category: "action",
  },
];

export function mergeNodeCatalog(
  ...catalogs: AutomationNodeCatalogEntry[][]
): AutomationNodeCatalogEntry[] {
  const merged: AutomationNodeCatalogEntry[] = [];
  const seen = new Set<string>();

  for (const catalog of catalogs) {
    for (const entry of catalog) {
      if (seen.has(entry.type)) {
        continue;
      }
      seen.add(entry.type);
      merged.push(entry);
    }
  }

  return merged;
}

export function catalogByCategory(
  catalog: AutomationNodeCatalogEntry[],
  category: AutomationNodeCategory,
): AutomationNodeCatalogEntry[] {
  return catalog.filter((entry) => entry.category === category);
}
