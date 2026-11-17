"use client";
import "client-only";

import { useState } from "react";

import type { Field } from "@puckeditor/core";
import { MenuIcon, SettingsIcon } from "lucide-react";

import { PropHeader } from "@/puck/components/prop-header";
import { SegmentedControl } from "@/puck/components/segmented-control";
import type { ContentFieldRenderProps } from "@/puck/utils/with-content-field";
import { withContentField } from "@/puck/utils/with-content-field";
import { Button } from "@/shared/ui/button";

import {
  NAVBAR_BLOCK_DEFAULT_CONTENT,
  NAVBAR_COLLAPSE_ITEMS,
  NAVBAR_LAYOUT_ITEMS,
} from "./defaults";
import type {
  NavbarBlockContent,
  NavbarCollapse,
  NavbarLayout,
} from "./types";
import { MenuItemsDialog } from "./ui/menu-items-dialog";

/**
 * The Navigation section of the NavbarBlock.
 *
 * The desktop layout sits next to the typed menu tree it affects. The tree
 * itself is edited in a dedicated two-pane dialog: the 300px sidebar is too
 * narrow for nested items, so it only keeps the layout choice, an item count
 * and the entry point.
 */
export const NavbarContentField: Field<NavbarBlockContent | undefined> =
  withContentField<NavbarBlockContent>({
    label: "Navigation",
    icon: <MenuIcon className="size-4 text-muted-foreground" />,
    render: (props) => <NavbarNavigationSection {...props} />,
  });

const NavbarNavigationSection = ({
  value,
  update,
  reset,
}: ContentFieldRenderProps<NavbarBlockContent>) => {
  const [open, setOpen] = useState(false);

  const items = value.items ?? NAVBAR_BLOCK_DEFAULT_CONTENT.items;
  const itemCount = items.length;

  return (
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
          name="collapseAt"
          label="Collapse menu at"
          isModified={
            value.collapseAt !== undefined &&
            value.collapseAt !== NAVBAR_BLOCK_DEFAULT_CONTENT.collapseAt
          }
          onReset={() => reset("collapseAt")}
        />
        <SegmentedControl<NavbarCollapse>
          name="collapseAt"
          value={value.collapseAt ?? NAVBAR_BLOCK_DEFAULT_CONTENT.collapseAt}
          onChange={(next) => update("collapseAt", next)}
          items={NAVBAR_COLLAPSE_ITEMS}
        />
        <span className="text-xs text-muted-foreground">
          Tablet keeps the inline menu until 1024px, then shows the hamburger.
          Mobile collapses below 768px.
        </span>
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
          onReset={() => update("items", NAVBAR_BLOCK_DEFAULT_CONTENT.items)}
        />
        <div className="flex items-center justify-between gap-3 rounded-md border p-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-xs font-medium">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="text-xs text-muted-foreground">
              Edit the menu in a dedicated dialog.
            </span>
          </div>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={() => setOpen(true)}
          >
            <SettingsIcon data-icon="inline-start" />
            Edit items
          </Button>
        </div>
      </div>

      <MenuItemsDialog
        open={open}
        items={items}
        onOpenChange={setOpen}
        onSave={(nextItems) => update("items", nextItems)}
      />
    </div>
  );
};
