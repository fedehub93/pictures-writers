import { ComponentConfig } from "@puckeditor/core";

import { buildColorOptions } from "@/puck/constants";
import { createLinkField } from "@/puck/fields/link";

import type { AnnouncementBarBlockProps } from "./types";
import { AnnouncementBarBlockUi } from "./ui/announcement-bar";

export type { AnnouncementBarBlockProps };

/**
 * Extra theme tokens for the banner. `primary`/`primary-foreground` are the
 * default pair; the neutrals let a customer build a quieter banner without
 * opening the theme editor.
 */
const COLOR_OPTIONS = buildColorOptions([
  { label: "Primary foreground", value: "var(--primary-foreground)" },
  { label: "Background", value: "var(--background)" },
  { label: "Foreground", value: "var(--foreground)" },
  { label: "Muted", value: "var(--muted)" },
  { label: "Accent", value: "var(--accent)" },
]);

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
    backgroundColor: {
      type: "select",
      label: "Background color",
      options: COLOR_OPTIONS,
    },
    textColor: {
      type: "select",
      label: "Text color",
      options: COLOR_OPTIONS,
    },
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
    backgroundColor: "var(--primary)",
    textColor: "var(--primary-foreground)",
    dismissible: false,
  },
  render: ({ id, text, link, backgroundColor, textColor, dismissible, puck }) => (
    <AnnouncementBarBlockUi
      id={id}
      text={text}
      link={link}
      backgroundColor={backgroundColor}
      textColor={textColor}
      dismissible={dismissible}
      editMode={puck.isEditing}
    />
  ),
};
