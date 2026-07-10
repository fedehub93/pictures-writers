"use client";

import { GridIcon } from "lucide-react";

import {
  type GridLayoutProperties,
  type LayoutsType,
  type FormLayout,
} from "../../../types";

import { GROUP_LAYOUT } from "../../../constants";

import { DesignerComponent } from "./designer-component";

const type: LayoutsType = "Grid";

const properties: GridLayoutProperties = {
  label: "Grid",
  column: 2,
  gap: "2px",
};

export const GridFormLayout: FormLayout = {
  group: "layout",
  type,
  construct: (id: string) => ({
    id,
    group: GROUP_LAYOUT,
    type,
    properties,
    children: [],
  }),
  designerBtnElement: {
    icon: GridIcon,
    label: "Grid",
  },
  designerComponent: DesignerComponent,
  formComponent: () => <div>Form Component</div>,
  propertiesComponent: () => <div>Properties Component</div>,
};
