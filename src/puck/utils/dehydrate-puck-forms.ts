import type { Content, Data } from "@puckeditor/core";
import type { SavedComponents } from "../config";

/**
 * Strip the inline content of Form blocks before persisting a Puck document.
 *
 * The input is intentionally typed as the broad `Data`: Site regions have
 * palettes wider than the page component map, and dehydration only needs to
 * find Form blocks.
 */
export function dehydratePuckForms(puckData: Data): Data<SavedComponents> {
  const data = structuredClone(puckData) as unknown as Data<SavedComponents>;

  if (!data) return data;

  const dehydrateBlocks = (blocks: Content<SavedComponents>) => {
    for (const block of blocks) {
      if (block.type === "Form" && block.props.form) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (block.props.form as any).content;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (block.props.form as any).gtmEventName;
      }

      if (
        "items" in block.props &&
        Array.isArray(block.props.items) &&
        block.props.items.length > 0
      ) {
        dehydrateBlocks(block.props.items);
      }
    }
  };

  if (Array.isArray(data.content)) {
    dehydrateBlocks(data.content);
  }

  if (data.zones) {
    for (const zoneKey in data.zones) {
      if (Array.isArray(data.zones[zoneKey])) {
        dehydrateBlocks(data.zones[zoneKey]);
      }
    }
  }

  return data;
}
