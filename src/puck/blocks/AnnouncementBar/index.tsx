import { ComponentConfig } from "@puckeditor/core";

import { DecorationField } from "@/puck/fields/decoration";
import { DimensionField } from "@/puck/fields/dimension";
import { TypographyField } from "@/puck/fields/typography";
import { createLinkField } from "@/puck/fields/link";

import {
  ANNOUNCEMENT_DEFAULT_DECORATION,
  ANNOUNCEMENT_DEFAULT_DIMENSION,
  ANNOUNCEMENT_DEFAULT_TYPOGRAPHY,
} from "./defaults";
import type { AnnouncementBarBlockProps } from "./types";
import { renderAnnouncementBarBlock } from "./render";

export type { AnnouncementBarBlockProps };

/**
 * The banner renders its own text, so the link editor hides the label control:
 * offering a label that never reaches the page would be dead UI.
 */
const AnnouncementLinkField = createLinkField({ showLabel: false });

export const AnnouncementBar: ComponentConfig<AnnouncementBarBlockProps> = {
  fields: {
    text: {
      type: "textarea",
      label: "Text",
    },
    link: AnnouncementLinkField,
    dimension: DimensionField,
    typography: TypographyField,
    decoration: DecorationField,
    dismissible: {
      type: "radio",
      label: "Dismissible",
      options: [
        { label: "Show close button", value: true },
        { label: "Always visible", value: false },
      ],
    },
  },
  defaultProps: {
    text: "Your announcement here.",
    link: { type: "external", url: "", label: "" },
    dimension: ANNOUNCEMENT_DEFAULT_DIMENSION,
    typography: ANNOUNCEMENT_DEFAULT_TYPOGRAPHY,
    decoration: ANNOUNCEMENT_DEFAULT_DECORATION,
    dismissible: false,
  },
  render: renderAnnouncementBarBlock,
};
