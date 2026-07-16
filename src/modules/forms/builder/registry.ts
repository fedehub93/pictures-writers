import { TextFieldFormElement } from "./ui/fields/text-field";
import { GridFormLayout } from "./ui/layouts/grid";

import type { FormElementsType, FormLayoutsType } from "./types";

export const FormElements: FormElementsType = {
  TextField: TextFieldFormElement,
};

export const FormLayouts: FormLayoutsType = {
  Grid: GridFormLayout,
};

export const FormNodes = {
  ...FormElements,
  ...FormLayouts,
};
