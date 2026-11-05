"use client";
import "client-only";

import type { Field } from "@puckeditor/core";
import { MenuIcon } from "lucide-react";

import { withAccordionField } from "@/puck/utils/with-accordion-field";

import type { NavItem } from "./types";
import { MenuItemsEditor } from "./ui/menu-items-editor";

/**
 * Puck field for the typed navbar tree.
 *
 * A custom field is required because the tree is a discriminated union: the
 * generic array field has one shape per item and cannot switch the controls
 * based on the `type` discriminator.
 */
export const MenuItemsField: Field<NavItem[] | undefined> = withAccordionField(
  "Menu items",
  <MenuIcon className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: NavItem[]) => void;
    value?: NavItem[];
  }) => (
    <MenuItemsEditor
      items={value ?? []}
      onChange={(items) => onChange(items)}
    />
  ),
  true,
);
