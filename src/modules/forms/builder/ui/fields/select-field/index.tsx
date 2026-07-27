import { ListChevronsUpDownIcon } from "lucide-react";
import type { ElementsType, FormElement } from "../../../types/core";
import type { SelectFieldProperties } from "../../../types/properties";

import { SelectFieldDesignerComponent } from "./designer-component";
import { buildSchema } from "./schemas";
import { SelectFieldPropertiesComponent } from "./properties-component";
import { SelectFieldFormComponent } from "./form-component";

const type: ElementsType = "SelectField";

const properties: SelectFieldProperties = {
  name: "select-field",
  label: "Select field",
  helperText: "",
  placeholder: "",
  validation: {
    required: false,
  },
  options: [],
};

export const SelectFieldFormElement = {
  isContainer: false,
  type,
  construct: (id: string) => ({
    id,
    isContainer: false,
    type,
    properties,
  }),
  designerBtnElement: {
    icon: ListChevronsUpDownIcon,
    label: "Select",
  },
  designerComponent: SelectFieldDesignerComponent,
  formComponent: SelectFieldFormComponent,
  propertiesComponent: SelectFieldPropertiesComponent,
  buildSchema,
  getInitialValue: () => "",
} satisfies FormElement<"SelectField">;
