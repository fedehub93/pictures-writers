import React from "react";
import { type LucideIcon } from "lucide-react";

import { TextFieldFormElement } from "./ui/fields/text-field/text-field";
import { GridFormLayout } from "./ui/layouts/grid/grid-layout";

// --- 1. Base Node Types ---
export type RootType = "Root";
export type ElementsType = "TextField";
export type LayoutsType = "Grid";

export type NodesType = RootType | ElementsType | LayoutsType;

export interface BaseNodeInstance {
  id: string;
  isContainer: boolean;
  type: NodesType;
}

// --- 2. Root ---
export interface RootProperties {
  theme?: string;
}

export interface FormRootInstance extends BaseNodeInstance {
  id: "root"; // Fixed literal ID
  isContainer: true; // The root is always a container
  type: RootType;
  properties: RootProperties;
  children: FormNodeDynamicInstance[]; // Can contain Layouts or Elements
}

// --- 3. Elements ---
export interface BaseFieldProperties {
  label: string;
  helperText: string;
  placeholder: string;
}

export interface TextFieldProperties extends BaseFieldProperties {}

export type FormElementPropertiesByType = {
  TextField: TextFieldProperties;
};

export interface FormElementInstance<
  TType extends ElementsType = ElementsType,
> extends BaseNodeInstance {
  isContainer: false; // Elements cannot have children
  type: TType;
  properties: FormElementPropertiesByType[TType];
}

export type FormElement<TType extends ElementsType = ElementsType> = {
  isContainer: false;
  type: TType;
  construct: (id: string) => FormElementInstance<TType>;
  designerBtnElement: {
    icon: LucideIcon;
    label: string;
  };
  // Using React.ComponentType instead of React.FC for passing component references
  designerComponent: React.ComponentType<{
    index: number;
    elementInstance: FormElementInstance<TType>;
  }>;
  formComponent: React.ComponentType<{
    elementInstance: FormElementInstance<TType>;
  }>;
  propertiesComponent: React.ComponentType<{
    elementInstance: FormElementInstance<TType>;
  }>;
};

export type FormElementsType = {
  [K in ElementsType]: FormElement<K>;
};

export const FormElements = {
  TextField: TextFieldFormElement,
} satisfies FormElementsType;

// --- 4. Layouts ---
export interface GridLayoutProperties {
  label: string;
  column: number;
  gap: string;
}

// Renamed for consistency with FormElementPropertiesByType
export type FormLayoutPropertiesByType = {
  Grid: GridLayoutProperties;
};

export interface FormLayoutInstance<
  TType extends LayoutsType = LayoutsType,
> extends BaseNodeInstance {
  isContainer: true; // Layouts can have children
  type: TType;
  properties: FormLayoutPropertiesByType[TType];
  children: FormElementInstance[]; // Layouts can strictly contain only other Elements
}

export type FormLayout<TType extends LayoutsType = LayoutsType> = {
  isContainer: true;
  type: TType;
  construct: (id: string) => FormLayoutInstance<TType>;
  designerBtnElement: {
    icon: LucideIcon;
    label: string;
  };
  designerComponent: React.ComponentType<{
    elementInstance: FormLayoutInstance<TType>;
    isDropTarget: boolean;
  }>;
  formComponent: React.ComponentType<{
    elementInstance: FormLayoutInstance<TType>;
  }>;
  propertiesComponent: React.ComponentType<{
    elementInstance: FormLayoutInstance<TType>;
  }>;
};

export type FormLayoutsType = {
  [K in LayoutsType]: FormLayout<K>;
};

export const FormLayouts = {
  Grid: GridFormLayout,
} satisfies FormLayoutsType;

// --- 5. Unions & Collections ---
// FormNode and FormNodeInstance ONLY include dynamic items (Layouts and Elements).

export type FormNode = FormElement | FormLayout;
export type FormNodeInstance =
  | FormRootInstance
  | FormElementInstance
  | FormLayoutInstance;

export type FormNodeDynamicInstance = FormElementInstance | FormLayoutInstance;
export type FormNodeContainerInstance = FormRootInstance | FormLayoutInstance;

export const FormNodes = {
  ...FormElements,
  ...FormLayouts,
};

// --- 6. State Definition ---
// Main type for the state manager (e.g., Zustand or Redux)
export type FormBuilderState = {
  root: FormRootInstance;
};

// --- 7. dnd-kit ---
export type DragData = {
  type: ElementsType | LayoutsType;
  isDesignerBtnElement: boolean;
};

// Strengthened type guard: verifies both key existence and primitive type
export const isDragData = (data: unknown): data is DragData => {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.type === "string" && typeof d.isDesignerBtnElement === "boolean"
  );
};

export enum DropAreaZone {
  ROOT = "Root",
  GRID = "Grid",
}
export type DropAreaType = DropAreaZone.ROOT | DropAreaZone.GRID;

export type DesignerWrapperData = {
  id: string | "root";
  isDesignerBtnElement: boolean;
  type: ElementsType | LayoutsType;
  area: DropAreaType;
};

// Strengthened type guard
export const isDesignerWrapperData = (
  data: unknown,
): data is DesignerWrapperData => {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.isDesignerBtnElement === "boolean" &&
    typeof d.type === "string" &&
    typeof d.area === "string"
  );
};

export type GenericData = {
  id: string | "root";
  area: DropAreaType;
};

// Strengthened type guard
export const isGenericData = (data: unknown): data is GenericData => {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return typeof d.id === "string" && typeof d.area === "string";
};
