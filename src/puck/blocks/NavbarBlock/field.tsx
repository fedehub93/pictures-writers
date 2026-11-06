"use client";
import "client-only";

import type { Field } from "@puckeditor/core";
import { MenuIcon } from "lucide-react";

import { PropHeader } from "@/puck/components/prop-header";
import { SegmentedControl } from "@/puck/components/segmented-control";
import { withContentField } from "@/puck/utils/with-content-field";

import { NAVBAR_BLOCK_DEFAULT_CONTENT, NAVBAR_LAYOUT_ITEMS } from "./defaults";
import type { NavbarBlockContent, NavbarLayout } from "./types";
import { MenuItemsEditor } from "./ui/menu-items-editor";

/**
 * The Navigation section of the NavbarBlock.
 *
 * The desktop layout sits next to the typed menu tree it affects, and the tree
 * keeps using the structured editor because the generic array field cannot
 * express its discriminated union.
 */
export const NavbarContentField: Field<NavbarBlockContent | undefined> =
  withContentField<NavbarBlockContent>({
    label: "Navigation",
    icon: <MenuIcon className="size-4 text-muted-foreground" />,
    render: ({ value, update, reset }) => (
      <div className="grid grid-cols-1 gap-y-4 p-1">
        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="layout"
            label="Desktop layout"
            isModified={
              value.layout !== undefined &&
              value.layout !== NAVBAR_BLOCK_DEFAULT_CONTENT.layout
            }
            onReset={() => reset("layout")}
          />
          <SegmentedControl<NavbarLayout>
            name="layout"
            value={value.layout ?? NAVBAR_BLOCK_DEFAULT_CONTENT.layout}
            onChange={(next) => update("layout", next)}
            items={NAVBAR_LAYOUT_ITEMS}
          />
        </div>

        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="items"
            label="Menu items"
            isModified={
              value.items !== undefined &&
              JSON.stringify(value.items) !==
                JSON.stringify(NAVBAR_BLOCK_DEFAULT_CONTENT.items)
            }
            onReset={() =>
              update("items", NAVBAR_BLOCK_DEFAULT_CONTENT.items)
            }
          />
          <MenuItemsEditor
            items={value.items ?? NAVBAR_BLOCK_DEFAULT_CONTENT.items}
            onChange={(items) => update("items", items)}
          />
        </div>
      </div>
    ),
  });
