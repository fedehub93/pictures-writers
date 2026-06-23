import { type LucideIcon } from "lucide-react";

import { TextFieldFormElement } from "./ui/fields/text-field/text-field";
import { GridFormLayout } from "./ui/layouts/grid/grid-layout";

export type ElementsType = "TextField";
export type LayoutsType = "Grid";
export type NodesType = ElementsType | LayoutsType;

// Elements
export interface BaseFieldProperties {
  label: string;
  helperText: string;
  placeHolder: string;
}

export interface TextFieldProperties extends BaseFieldProperties {}

export type FormElementPropertiesByType = {
  TextField: TextFieldProperties;
};

export type FormElementInstance<TType extends ElementsType = ElementsType> = {
  id: string;
  type: TType;
  properties: FormElementPropertiesByType[TType];
};

export type FormElement<TType extends ElementsType = ElementsType> = {
  type: TType;
  construct: (id: string) => FormElementInstance<TType>;
  designerBtnElement: {
    icon: LucideIcon;
    label: string;
  };
  designerComponent: React.FC<{
    elementInstance: FormElementInstance<TType>;
  }>;
  formComponent: React.FC<{
    elementInstance: FormElementInstance<TType>;
  }>;
  propertiesComponent: React.FC<{
    elementInstance: FormElementInstance<TType>;
  }>;
};

export type FormElementsType = {
  [K in ElementsType]: FormElement<K>;
};

export const FormElements = {
  TextField: TextFieldFormElement,
} satisfies FormElementsType;

// Layouts
export interface GridLayoutProperties {
  label: string;
  column: number;
  gap: string;
}

export type GridLayoutPropertiesByType = {
  Grid: GridLayoutProperties;
};

export type FormLayoutInstance<TType extends LayoutsType = LayoutsType> = {
  id: string;
  type: TType;
  properties: GridLayoutPropertiesByType[TType];
  children: FormElementInstance[];
};

export type FormLayout<TType extends LayoutsType = LayoutsType> = {
  type: TType;
  construct: (id: string) => FormLayoutInstance<TType>;
  designerBtnElement: {
    icon: LucideIcon;
    label: string;
  };
  designerComponent: React.FC<{
    elementInstance: FormLayoutInstance<TType>;
  }>;
  formComponent: React.FC<{
    elementInstance: FormLayoutInstance<TType>;
  }>;
  propertiesComponent: React.FC<{
    elementInstance: FormLayoutInstance<TType>;
  }>;
};

export type FormLayoutsType = {
  [K in LayoutsType]: FormLayout<K>;
};

export const FormLayouts = {
  Grid: GridFormLayout,
} satisfies FormLayoutsType;

export type FormNode = FormElement | FormLayout;
export type FormNodeInstance = FormElementInstance | FormLayoutInstance;

export const FormNodes = {
  ...FormElements,
  ...FormLayouts,
};

// dnd-kit
export type DragData = {
  type: ElementsType | LayoutsType;
  isDesignerBtnElement: boolean;
};

export const isDragData = (data: unknown): data is DragData => {
  if (!data || typeof data !== "object") return false;

  return "type" in data && "isDesignerBtnElement" in data;
};

export enum DropAreaZone {
  DESIGNER = "Designer",
  GRID = "Grid",
}
export type DropAreaType = DropAreaZone.DESIGNER | DropAreaZone.GRID;

export type DropData = {
  area: DropAreaType;
};

export const isDropData = (data: unknown): data is DropData => {
  if (!data || typeof data !== "object") return false;

  return "area" in data;
};
