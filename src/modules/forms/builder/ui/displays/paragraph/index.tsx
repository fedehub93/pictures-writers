"use client";

import "client-only";
import { lazy } from "react";
import { TextIcon } from "lucide-react";
import { DisplayType, FormDisplay } from "../../../types/core";
import { ParagraphDesignerComponent } from "./designer-component";
import { ParagraphFormComponent } from "./form-component";

const ParagraphPropertiesComponent = lazy(() =>
  import("./properties-component").then((module) => ({
    default: module.ParagraphPropertiesComponent,
  })),
);

const type: DisplayType = "Paragraph";

export const ParagraphFormElement = {
  isContainer: false,
  type,
  construct: (id: string) => ({
    id,
    isContainer: false,
    type,
    properties: {
      label: "Paragrah",
      content: "",
    },
  }),
  designerBtnElement: {
    icon: TextIcon,
    label: "Paragraph",
  },
  designerComponent: ParagraphDesignerComponent,
  formComponent: ParagraphFormComponent,
  propertiesComponent: ParagraphPropertiesComponent,
} satisfies FormDisplay<"Paragraph">;
