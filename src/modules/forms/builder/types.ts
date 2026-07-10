import { type LucideIcon } from "lucide-react";

import { TextFieldFormElement } from "./ui/fields/text-field/text-field";
import { GridFormLayout } from "./ui/layouts/grid/grid-layout";
import { GROUP_ELEMENT, GROUP_LAYOUT } from "./constants";

// --- 1. Base Node Types ---
export type RootType = "Root";
export type ElementsType = "TextField";
export type LayoutsType = "Grid";

// Nota: RootType non è incluso in NodesType perché il Root non
// è un nodo "generico" scambiabile o annidabile.
export type NodesType = RootType | ElementsType | LayoutsType;

export type DroppableNodes = Omit<NodesType, RootType>;

export interface BaseNodeInstance {
  id: string;
  group: typeof GROUP_ELEMENT | typeof GROUP_LAYOUT;
  type: NodesType;
}

// --- 2. Root ---
export interface RootProperties {
  // Qui puoi inserire impostazioni globali del form
  // es: theme: "light" | "dark", actionUrl: string, ecc.
  theme?: string;
}

export interface FormRootInstance extends BaseNodeInstance {
  id: "root"; // ID letterale fisso
  group: typeof GROUP_LAYOUT; // Il Root è considerato un layout speciale
  type: RootType;
  properties: RootProperties;
  children: FormNodeDynamicInstance[]; // Può contenere Layouts o Elements
}

// --- 3. Elements ---
export interface BaseFieldProperties {
  label: string;
  helperText: string;
  placeHolder: string;
}

export interface TextFieldProperties extends BaseFieldProperties {}

export type FormElementPropertiesByType = {
  TextField: TextFieldProperties;
};

export interface FormElementInstance<
  TType extends ElementsType = ElementsType,
> extends BaseNodeInstance {
  group: typeof GROUP_ELEMENT;
  type: TType;
  properties: FormElementPropertiesByType[TType];
}

export type FormElement<TType extends ElementsType = ElementsType> = {
  group: typeof GROUP_ELEMENT;
  type: TType;
  construct: (id: string) => FormElementInstance<TType>;
  designerBtnElement: {
    icon: LucideIcon;
    label: string;
  };
  designerComponent: React.FC<{
    index: number;
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

// --- 4. Layouts ---
export interface GridLayoutProperties {
  label: string;
  column: number;
  gap: string;
}

export type GridLayoutPropertiesByType = {
  Grid: GridLayoutProperties;
};

export interface FormLayoutInstance<
  TType extends LayoutsType = LayoutsType,
> extends BaseNodeInstance {
  group: typeof GROUP_LAYOUT;
  type: TType;
  properties: GridLayoutPropertiesByType[TType];
  children: FormNodeDynamicInstance[]; // Layouts can contain other nodes
}

export type FormLayout<TType extends LayoutsType = LayoutsType> = {
  group: typeof GROUP_LAYOUT;
  type: TType;
  construct: (id: string) => FormLayoutInstance<TType>;
  designerBtnElement: {
    icon: LucideIcon;
    label: string;
  };
  designerComponent: React.FC<{
    elementInstance: FormLayoutInstance<TType>;
    ref: (element: Element | null) => void;
    isDropTarget: boolean;
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

// --- 5. Unions & Collections ---
// FormNode e FormNodeInstance includono SOLO gli elementi dinamici (Layout e Elements).

export type FormNode = FormElement | FormLayout;
export type FormNodeInstance =
  | FormRootInstance
  | FormElementInstance
  | FormLayoutInstance;
export type FormNodeDynamicInstance = FormElementInstance | FormLayoutInstance;

export const FormNodes = {
  ...FormElements,
  ...FormLayouts,
};

// --- 6. State Definition (Esempio) ---
// Questo sarà il tipo principale del tuo store (es. Zustand o Redux)
export type FormBuilderState = {
  root: FormRootInstance;
};

// --- 7. dnd-kit ---
export type DragData = {
  type: ElementsType | LayoutsType;
  isDesignerBtnElement: boolean;
};

export const isDragData = (data: unknown): data is DragData => {
  if (!data || typeof data !== "object") return false;
  return "type" in data && "isDesignerBtnElement" in data;
};

export enum DropAreaZone {
  ROOT = "Root",
  GRID = "Grid",
}
export type DropAreaType = DropAreaZone.ROOT | DropAreaZone.GRID;

export type DropData = {
  area: DropAreaType;
  id: string | "root";
};

export const isDropData = (data: unknown): data is DropData => {
  if (!data || typeof data !== "object") return false;
  return "area" in data && "id" in data;
};
