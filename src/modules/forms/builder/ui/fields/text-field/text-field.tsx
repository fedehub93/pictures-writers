"use client";

import { TypeIcon } from "lucide-react";

import {
  type TextFieldProperties,
  type ElementsType,
  type FormElement,
} from "../../../types";

import { DesignerComponent } from "./designer-component";
import { GROUP_ELEMENT } from "../../../constants";

const type: ElementsType = "TextField";

const properties: TextFieldProperties = {
  label: "Text field",
  helperText: "Helper text",
  placeHolder: "Value here...",
};

export const TextFieldFormElement: FormElement = {
  group: "element",
  type,
  construct: (id: string) => ({
    id,
    group: GROUP_ELEMENT,
    type,
    properties,
  }),
  designerBtnElement: {
    icon: TypeIcon,
    label: "Text field",
  },
  designerComponent: DesignerComponent,
  formComponent: () => <div>Form Component</div>,
  propertiesComponent: () => <div>Properties Component</div>,
};
