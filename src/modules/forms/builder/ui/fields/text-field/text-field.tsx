"use client";

import { TypeIcon } from "lucide-react";

import {
  type TextFieldProperties,
  type ElementsType,
  type FormElement,
} from "../../../types";

import { DesignerComponent } from "./designer-component";
import { TextFieldPropertiesForm } from "./properties-component";

const type: ElementsType = "TextField";

const properties: TextFieldProperties = {
  label: "Text field",
  helperText: "Helper text",
  placeholder: "Value here...",
};

export const TextFieldFormElement: FormElement = {
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
};
