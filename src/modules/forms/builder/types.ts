import z from "zod";
import type { LucideIcon } from "lucide-react";

// --- 1. Base Node Types ---
export type RootType = "Root";
export type ElementsType = "TextField" | "TextareaField";
export type LayoutsType = "Grid";

export type NodesType = RootType | ElementsType | LayoutsType;

export type DesignerBtnElement = {
  icon: LucideIcon;
  label: string;
};

export type BaseFormBlueprint<
  TType extends NodesType,
  TNodeInstance extends BaseNodeInstance,
> = {
  type: TType;
  isContainer: boolean;
  construct: (id: string) => TNodeInstance;
  designerBtnElement: DesignerBtnElement;
  designerComponent: React.ComponentType<{ elementInstance: TNodeInstance }>;
  formComponent: React.ComponentType<{ elementInstance: TNodeInstance }>;
  propertiesComponent: React.ComponentType<{ elementInstance: TNodeInstance }>;
};

export interface BaseNodeInstance {
  id: string;
  isContainer: boolean;
  type: NodesType;
}

// --- 2. Validation ---
export interface BaseValidation {
  required: boolean;
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
  name: string;
  label: string;
  helperText: string;
  placeholder: string;
  validation: BaseValidation;
}

export interface TextFieldValidation extends BaseValidation {
  minLength?: number;
  maxLength?: number;
}

export enum TextInputEnum {
  Text = "text",
  Email = "email",
}

export interface TextFieldProperties extends BaseFieldProperties {
  inputType: TextInputEnum;
  validation: TextFieldValidation;
}

export interface TextareaFieldValidation extends BaseValidation {
  minLength?: number;
  maxLength?: number;
}

export interface TextareaFieldProperties extends BaseFieldProperties {
  validation: TextareaFieldValidation;
}

export type FormElementPropertiesByType = {
  TextField: TextFieldProperties;
  TextareaField: TextareaFieldProperties;
};

export type FormElementValueByType = {
  TextField: string;
  TextareaField: string;
};

export interface FormElementInstance<
  TType extends ElementsType = ElementsType,
> extends BaseNodeInstance {
  isContainer: false; // Elements cannot have children
  type: TType;
  properties: FormElementPropertiesByType[TType];
}

export type FormElement<TType extends ElementsType = ElementsType> =
  BaseFormBlueprint<TType, FormElementInstance<TType>> & {
    isContainer: false;
    buildSchema: (properties: FormElementPropertiesByType[TType]) => z.ZodType;
    getInitialValue: (
      properties: FormElementPropertiesByType[TType],
    ) => FormElementValueByType[TType];
  };

export type FormElementsType = {
  [K in ElementsType]: FormElement<K>;
};

// --- 4. Layouts ---
export interface BaseLayoutProperties {
  label: string;
}

export interface GridLayoutProperties extends BaseLayoutProperties {
  columns?: number;
  gap?: number;
}

export type FormLayoutPropertiesByType = {
  Grid: GridLayoutProperties;
};

export interface FormLayoutInstance<
  TType extends LayoutsType = LayoutsType,
> extends BaseNodeInstance {
  isContainer: true; // Layouts can have children
  type: TType;
  properties: FormLayoutPropertiesByType[TType];
  children: FormElementInstanceUnion[]; // Layouts can strictly contain only other Elements
}

// --- 3. Layout Blueprint ---
export type FormLayout<TType extends LayoutsType = LayoutsType> =
  BaseFormBlueprint<TType, FormLayoutInstance<TType>> & {
    isContainer: true;
  };

export type FormLayoutsType = {
  [K in LayoutsType]: FormLayout<K>;
};

// --- 5. Unions & Collections ---

export type AnyFormElement = FormElementsType[ElementsType];

export type AnyFormLayout = FormLayoutsType[LayoutsType];

export type FormNode = AnyFormElement | AnyFormLayout;

export type FormElementInstanceUnion = {
  [K in ElementsType]: FormElementInstance<K>;
}[ElementsType];

export type FormLayoutInstanceUnion = {
  [K in LayoutsType]: FormLayoutInstance<K>;
}[LayoutsType];

export type FormNodeInstance =
  | FormRootInstance
  | FormElementInstanceUnion
  | FormLayoutInstanceUnion;

export type FormNodeDynamicInstance =
  | FormElementInstanceUnion
  | FormLayoutInstanceUnion;
export type FormNodeContainerInstance =
  | FormRootInstance
  | FormLayoutInstanceUnion;

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
