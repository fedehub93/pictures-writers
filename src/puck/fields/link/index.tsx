import type { Field } from "@puckeditor/core";
import { LinkIcon } from "lucide-react";

import { withAccordionField } from "@/puck/utils/with-accordion-field";

import { LinkView } from "./ui/view/link-view";
import { normalizeLinkProps } from "./types";
import type {
  LegacyLinkProps,
  LinkListItem,
  LinkProps,
} from "./types";

export type {
  LegacyLinkProps,
  LinkListItem,
  LinkProps,
  SmartLink,
  SmartLinkType,
} from "./types";

export const LinkField = withAccordionField(
  "Link",
  <LinkIcon className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: LinkProps) => void;
    value: LinkProps | LegacyLinkProps | null | undefined;
  }) => {
    const state = normalizeLinkProps(value) ?? { type: "external", url: "" };

    return <LinkView state={state} onUpdate={onChange} />;
  },
  true,
);

/**
 * Editable list of SmartLinks, shared by the footer blocks that render a
 * column of links (LinkList, Copyright).
 */
export const LinksField: Field<LinkListItem[] | undefined> = {
  type: "array",
  label: "Links",
  arrayFields: {
    link: LinkField,
  },
  defaultItemProps: {
    link: { type: "external", url: "", label: "" },
  },
  getItemSummary: (item) => item.link?.label || "Link",
};
