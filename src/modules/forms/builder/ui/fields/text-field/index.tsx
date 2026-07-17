"use client";

import { TypeIcon } from "lucide-react";

import {
  type TextFieldProperties,
  type ElementsType,
  type FormElement,
  TextInputEnum,
} from "../../../types";

import { TextFieldDesignerComponent } from "./designer-component";
import { TextFieldFormComponent } from "./form-component";
import { TextFieldPropertiesComponent } from "./properties-component";

import { buildSchema } from "./schemas";

const type: ElementsType = "TextField";

const properties: TextFieldProperties = {
  name: "text-field",
  inputType: TextInputEnum.Text,
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
  designerComponent: TextFieldDesignerComponent,
  formComponent: TextFieldFormComponent,
  propertiesComponent: TextFieldPropertiesComponent,
  buildSchema,
  getInitialValue: () => "",
} satisfies FormElement<"TextField">;
