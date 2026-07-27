import { db } from "@/shared/lib/db";

import type { Content, Data } from "@puckeditor/core";

import type { HydratedComponents, SavedComponents } from "../config";

export async function hydratePuckForms(
  puckData: Data<SavedComponents>,
): Promise<Data<HydratedComponents>> {
  const data = structuredClone(puckData) as unknown as Data<HydratedComponents>;

  if (!data) return data;
  const hydrateBlocks = async (blocks: Content<HydratedComponents>) => {
    for (const block of blocks) {
      if (block.type === "Form" && block.props.form?.id) {
        const formData = await db.form.findUniqueOrThrow({
          where: { id: block.props.form.id },
        });

        if (formData.content) {
          block.props.form.content = formData.content;
        }
      }

      if ("items" in block.props && block.props.items.length > 0) {
        await hydrateBlocks(block.props.items);
      }
    }
  };

  if (Array.isArray(data.content)) {
    await hydrateBlocks(data.content);
  }

  if (data.zones) {
    for (const zoneKey in data.zones) {
      if (Array.isArray(data.zones[zoneKey])) {
        await hydrateBlocks(data.zones[zoneKey]);
      }
    }
  }

  return data;
}
