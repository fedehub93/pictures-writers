import type { FormRootInstance } from "../types";

import { FormElements } from "../registry";

import { getFlatFields } from "../helpers/get-flat-fields";

export function generateDefaultValues(
  state: FormRootInstance,
): Record<string, any> {
  const fields = getFlatFields(state.children);
  const defaultValues: Record<string, any> = {};

  for (const field of fields) {
    const blueprint = FormElements[field.type];
    const fieldName = field.properties.name;

    if (blueprint.getInitialValue && fieldName) {
      defaultValues[fieldName] = blueprint.getInitialValue(field.properties);
    }
  }

  return defaultValues;
}
