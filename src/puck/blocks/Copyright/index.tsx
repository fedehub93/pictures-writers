import { ComponentConfig } from "@puckeditor/core";

import { LinksField } from "@/puck/fields/link";

import type { CopyrightBlockProps } from "./types";
import { CopyrightBlockUi } from "./ui/copyright";

export type { CopyrightBlockProps };

export const Copyright: ComponentConfig<CopyrightBlockProps> = {
  fields: {
    showYear: {
      type: "radio",
      label: "Year",
      options: [
        { label: "Show current year", value: true },
        { label: "Hide year", value: false },
      ],
    },
    extraText: {
      type: "textarea",
      label: "Extra text",
    },
    links: LinksField,
  },
  defaultProps: {
    showYear: true,
    extraText: "",
    links: [],
  },
  render: ({ showYear, extraText, links }) => (
    <CopyrightBlockUi
      showYear={showYear}
      extraText={extraText}
      links={links}
    />
  ),
};
