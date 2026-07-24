import { SquareCheckIcon } from "lucide-react";
import type { ElementsType, FormElement } from "../../../types/core";
import type { CheckboxFieldProperties } from "../../../types/properties";

import { buildSchema } from "./schemas";
import { CheckboxFieldDesignerComponent } from "./designer-component";
import { CheckboxFieldPropertiesComponent } from "./properties-component";
import { CheckboxFieldFormComponent } from "./form-component";

const type: ElementsType = "CheckboxField";

const properties: CheckboxFieldProperties = {
  name: "checkbox-field",
  label: "Checkbox field",
  helperText: "",
  validation: {
    required: false,
  },
};

export const CheckboxFieldFormElement = {
  isContainer: false,
  type,
  construct: (id: string) => ({
    id,
    isContainer: false,
    type,
    properties,
  }),
  designerBtnElement: {
    icon: SquareCheckIcon,
    label: "Checkbox",
  },
  designerComponent: CheckboxFieldDesignerComponent,
  formComponent: CheckboxFieldFormComponent,
  propertiesComponent: CheckboxFieldPropertiesComponent,
  buildSchema,
  getInitialValue: () => false,
} satisfies FormElement<"CheckboxField">;
