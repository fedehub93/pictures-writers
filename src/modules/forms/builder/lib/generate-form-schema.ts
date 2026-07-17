import { z } from "zod";

import type { FormRootInstance } from "../types";
import { FormElements } from "../registry";
import { getFlatFields } from "../helpers/get-flat-fields";

export function generateFormSchema(state: FormRootInstance): z.ZodObject<any> {
  const schemaShape: Record<string, z.ZodType> = {};

  const fields = getFlatFields(state.children);

  for (const field of fields) {
    const blueprint = FormElements[field.type];
    const fieldName = field.properties.name;

    // Correlated union error
    const buildSchema = blueprint.buildSchema as (
      properties: typeof field.properties,
    ) => z.ZodType;

    if (fieldName) {
      schemaShape[fieldName] = buildSchema(field.properties);
    }
  }

  return z.object(schemaShape);
}
