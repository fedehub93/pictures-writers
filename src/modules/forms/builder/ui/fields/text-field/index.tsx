"use client";

import { TypeIcon } from "lucide-react";

import type {
  TextFieldProperties,
  ElementsType,
  FormElement,
} from "../../../types";

import { DesignerComponent } from "./designer-component";
import { TextFieldFormComponent } from "./form-component";
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
  formComponent: TextFieldFormComponent,
  propertiesComponent: TextFieldPropertiesForm,
  buildSchema,
  getInitialValue: () => {
    return "";
  },
} satisfies FormElement<"TextField">;
