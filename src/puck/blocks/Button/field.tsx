"use client";
import "client-only";

import type { Field } from "@puckeditor/core";
import { MousePointerClick } from "lucide-react";

import { withContentField } from "@/puck/utils/with-content-field";

import type { ButtonContentProps } from "./types";
import { ButtonContentView } from "./ui/view/button-content-view";

/**
 * The Button section.
 *
 * The authored content of the block is one object (`button`), so the text,
 * the Smart link and the icon share one accordion instead of appearing as
 * separate panel entries. A custom field keeps the controls in the order a
 * button reads and leaves the style fields to their own sections, like Form
 * and Link do.
 */
export const ButtonContentField: Field<ButtonContentProps | undefined> =
  withContentField<ButtonContentProps>({
    label: "Button",
    icon: <MousePointerClick className="size-4 text-muted-foreground" />,
    render: (props) => <ButtonContentView {...props} />,
  });
