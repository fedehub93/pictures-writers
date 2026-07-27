import type { Content, Data } from "@puckeditor/core";
import type { SavedComponents, HydratedComponents } from "../config"; // Adatta il path

export function dehydratePuckForms(
  puckData: Data<HydratedComponents>,
): Data<SavedComponents> {
  const data = structuredClone(puckData) as unknown as Data<SavedComponents>;

  if (!data) return data;

  const dehydrateBlocks = (blocks: Content<SavedComponents>) => {
    for (const block of blocks) {
      if (block.type === "Form" && block.props.form) {
        delete (block.props.form as any).content;
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
