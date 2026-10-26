import * as z from "zod/mini";

import type { FormRootInstance } from "../types/core";
import { FormElements } from "../registry";
import { getFlatFields } from "../helpers/get-flat-fields";

export function generateFormSchema(state: FormRootInstance): z.ZodMiniObject {
  const schemaShape: Record<string, z.ZodMiniType> = {};

  const fields = getFlatFields(state.children);

  for (const field of fields) {
    const blueprint = FormElements[field.type];
    const fieldName = field.properties.name;

    // Correlated union error
    const buildSchema = blueprint.buildSchema as (
      properties: typeof field.properties,
    ) => z.ZodMiniType;

    if (fieldName) {
      schemaShape[fieldName] = buildSchema(field.properties);
    }
  }

  return z.object(schemaShape);
}
