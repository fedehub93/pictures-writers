import z from "zod";

import type { LucideIcon } from "lucide-react";

import type {
  RootProperties,
  TextFieldProperties,
  TextareaFieldProperties,
  GridLayoutProperties,
  ParagraphProperties,
  SelectFieldProperties,
  UploadFieldProperties,
  ButtonProperties,
} from "./properties";

// --- 1. Base Node Types ---
export type RootType = "Root";
export type ElementsType =
  | "TextField"
  | "TextareaField"
  | "SelectField"
  | "UploadField";
export type DisplayType = "Paragraph" | "Button";
export type LayoutsType = "Grid";

export type NodesType = RootType | ElementsType | DisplayType | LayoutsType;

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

// --- 2. Dictionaries ---
export type FormElementPropertiesByType = {
  TextField: TextFieldProperties;
  TextareaField: TextareaFieldProperties;
  SelectField: SelectFieldProperties;
  UploadField: UploadFieldProperties;
};

export type FormElementValueByType = {
  TextField: string;
  TextareaField: string;
  SelectField: string;
  UploadField: [];
};

export type FormLayoutPropertiesByType = {
  Grid: GridLayoutProperties;
};

export type FormDisplayPropertiesByType = {
  Paragraph: ParagraphProperties;
  Button: ButtonProperties;
};

// --- 3. Node Instances ---
export interface FormRootInstance extends BaseNodeInstance {
  id: "root";
  isContainer: true;
  type: RootType;
  properties: RootProperties;
  children: FormNodeDynamicInstance[];
}

export interface FormElementInstance<
  TType extends ElementsType = ElementsType,
> extends BaseNodeInstance {
  isContainer: false;
  type: TType;
  properties: FormElementPropertiesByType[TType];
}

export interface FormLayoutInstance<
  TType extends LayoutsType = LayoutsType,
> extends BaseNodeInstance {
  isContainer: true;
  type: TType;
  properties: FormLayoutPropertiesByType[TType];
  children: FormNodeDynamicInstance[];
}

export interface FormDisplayInstance<
  TType extends DisplayType = DisplayType,
> extends BaseNodeInstance {
  isContainer: false;
  type: TType;
  properties: FormDisplayPropertiesByType[TType];
}

// --- 4. Blueprints ---
export type FormRoot<TType extends RootType = RootType> = BaseFormBlueprint<
  TType,
  FormRootInstance
> & {
  isContainer: true;
};

export type FormElement<TType extends ElementsType = ElementsType> =
  BaseFormBlueprint<TType, FormElementInstance<TType>> & {
    isContainer: false;
    buildSchema: (properties: FormElementPropertiesByType[TType]) => z.ZodType;
    getInitialValue: (
      properties: FormElementPropertiesByType[TType],
    ) => FormElementValueByType[TType];
  };

export type FormLayout<TType extends LayoutsType = LayoutsType> =
  BaseFormBlueprint<TType, FormLayoutInstance<TType>> & {
    isContainer: true;
  };

export type FormDisplay<TType extends DisplayType = DisplayType> =
  BaseFormBlueprint<TType, FormDisplayInstance<TType>> & {
    isContainer: false;
  };

// --- 5. Registries ---
export type FormElementsType = { [K in ElementsType]: FormElement<K> };
export type FormLayoutsType = { [K in LayoutsType]: FormLayout<K> };
export type FormDisplayType = { [K in DisplayType]: FormDisplay<K> };

// --- 6. Unions & Collections ---
export type AnyFormElement = FormElementsType[ElementsType];
export type AnyFormLayout = FormLayoutsType[LayoutsType];
export type AnyFormDisplay = FormDisplayType[DisplayType];

export type FormNode = AnyFormElement | AnyFormLayout | AnyFormDisplay;

export type FormElementInstanceUnion = {
  [K in ElementsType]: FormElementInstance<K>;
}[ElementsType];

export type FormLayoutInstanceUnion = {
  [K in LayoutsType]: FormLayoutInstance<K>;
}[LayoutsType];

export type FormDisplayInstanceUnion = {
  [K in DisplayType]: FormDisplayInstance<K>;
}[DisplayType];

export type FormNodeInstance =
  | FormRootInstance
  | FormElementInstanceUnion
  | FormLayoutInstanceUnion
  | FormDisplayInstanceUnion;

export type FormNodeDynamicInstance =
  | FormElementInstanceUnion
  | FormLayoutInstanceUnion
  | FormDisplayInstanceUnion;

export type FormNodeContainerInstance =
  | FormRootInstance
  | FormLayoutInstanceUnion;
