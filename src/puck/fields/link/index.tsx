import type { Field } from "@puckeditor/core";
import { LinkIcon } from "lucide-react";

import { withAccordionField } from "@/puck/utils/with-accordion-field";

import { LinkView } from "./ui/view/link-view";
import { normalizeLinkProps } from "./types";
import type { LegacyLinkProps, LinkProps } from "./types";

export type {
  LegacyLinkProps,
  LinkListItem,
  LinkProps,
  SmartLink,
  SmartLinkType,
} from "./types";

export const createLinkField = ({
  showLabel = true,
}: {
  showLabel?: boolean;
} = {}): Field =>
  withAccordionField(
    "Link",
    <LinkIcon className="size-4 text-muted-foreground" />,
    ({
      onChange,
      value,
    }: {
      onChange: (value: LinkProps) => void;
      value: LinkProps | LegacyLinkProps | null | undefined;
    }) => {
      const state = normalizeLinkProps(value) ?? {
        type: "external",
        url: "",
      };

      return (
        <LinkView state={state} onUpdate={onChange} showLabel={showLabel} />
      );
    },
    true,
  );

/**
 * Default single-link editor: target + visible label. Blocks that render their
 * own copy use `createLinkField({ showLabel: false })`.
 */
export const LinkField: Field = createLinkField();
