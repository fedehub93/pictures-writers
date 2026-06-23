"use client";

import { ElementsType, FormElement } from "./form-elements";

const type: ElementsType = "TextField";

export const TextFieldFormElement: FormElement = {
  type,
  designerComponent: () => <div>TextField Designer</div>,
  formComponent: () => <div>TextField Form</div>,
  propertiesComponent: () => <div>TextField Properties</div>,
};
