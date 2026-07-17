import type { FormElementsType, FormLayoutsType } from "./types";

import { GridFormLayout } from "./ui/layouts/grid";

import { TextFieldFormElement } from "./ui/fields/text-field";
import { TextareaFieldFormElement } from "./ui/fields/textarea-field";

export const FormElements: FormElementsType = {
  TextField: TextFieldFormElement,
  TextareaField: TextareaFieldFormElement,
};

export const FormLayouts: FormLayoutsType = {
  Grid: GridFormLayout,
};

export const FormNodes = {
  ...FormElements,
  ...FormLayouts,
};
