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

    // Correlated union error
    const getInitialValue = blueprint.getInitialValue as (
      properties: typeof field.properties,
    ) => any;

    if (getInitialValue && fieldName) {
      defaultValues[fieldName] = getInitialValue(field.properties);
    }
  }

  return defaultValues;
}
