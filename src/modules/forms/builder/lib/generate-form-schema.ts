import { z } from "zod";

import type { FormBuilderState } from "../types";
import { FormElements } from "../registry";
import { getFlatFields } from "../helpers/get-flat-fields";

export function generateFormSchema(state: FormBuilderState): z.ZodObject<any> {
  const schemaShape: Record<string, z.ZodType> = {};

  const fields = getFlatFields(state.root.children);

  for (const field of fields) {
    const blueprint = FormElements[field.type];
    const fieldName = field.properties.name;

    if (fieldName) {
      schemaShape[fieldName] = blueprint.buildSchema(field.properties);
    }
  }

  return z.object(schemaShape);
}
