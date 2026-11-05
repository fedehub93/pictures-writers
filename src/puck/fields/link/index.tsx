import { LinkIcon } from "lucide-react";

import { withAccordionField } from "@/puck/utils/with-accordion-field";

import { LinkView } from "./ui/view/link-view";
import { normalizeLinkProps } from "./types";
import type { LegacyLinkProps, LinkProps } from "./types";

export type {
  LegacyLinkProps,
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
