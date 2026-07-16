"use client";

import { TypeIcon } from "lucide-react";

import type {
  TextFieldProperties,
  ElementsType,
  FormElement,
} from "../../../types";

import { DesignerComponent } from "./designer-component";
import { TextFieldPropertiesForm } from "./properties-component";
import { buildSchema } from "./schemas";

const type: ElementsType = "TextField";

const properties: TextFieldProperties = {
  name: "text-field",
  label: "Text field",
  helperText: "",
  placeholder: "",
  validation: {
    required: false,
  },
};

export const TextFieldFormElement = {
  isContainer: false,
  type,
  construct: (id: string) => ({
    id,
    isContainer: false,
    type,
    properties,
  }),
  designerBtnElement: {
    icon: TypeIcon,
    label: "Text field",
  },
  designerComponent: DesignerComponent,
  formComponent: () => <div>Form Component</div>,
  propertiesComponent: TextFieldPropertiesForm,
  buildSchema,
  getInitialValue: () => {
    // If it will be a default value in the future put here
    return "";
  },
} satisfies FormElement<"TextField">;
