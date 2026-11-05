import { ComponentConfig } from "@puckeditor/core";

import { PALETTE_COLORS, THEME_COLORS } from "@/puck/constants";

import type { AlignType } from "@/puck/fields/typography/types";

import type { TextBlockProps } from "./types";
import { TextBlockUi } from "./ui/text";

export type { TextBlockProps };

const ALIGN_OPTIONS: { label: string; value: AlignType }[] = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
  { label: "Justify", value: "justify" },
];

const COLOR_OPTIONS = [
  { label: "Default", value: "" },
  ...THEME_COLORS.map(({ label, value }) => ({ label, value })),
  ...PALETTE_COLORS.map((value) => ({ label: value, value })),
];

export const Text: ComponentConfig<TextBlockProps> = {
  fields: {
    text: {
      type: "textarea",
      label: "Text",
    },
    align: {
      type: "select",
      label: "Alignment",
      options: ALIGN_OPTIONS,
    },
    color: {
      type: "select",
      label: "Color",
      options: COLOR_OPTIONS,
    },
  },
  defaultProps: {
    text: "Add your text here.",
    align: "left",
  },
  render: ({ text, align, color }) => {
    return <TextBlockUi text={text} align={align} color={color} />;
  },
};
