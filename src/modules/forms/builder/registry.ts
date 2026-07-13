import { TextFieldFormElement } from "./ui/fields/text-field/text-field";
import { GridFormLayout } from "./ui/layouts/grid/grid-layout";

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
