"use client";
import "client-only";

import { useState } from "react";
import { SettingsIcon } from "lucide-react";

import { PropHeader } from "@/puck/components/prop-header";
import { Button } from "@/shared/ui/button";

import type { LinkListItem } from "../types";
import { LinksDialog } from "./links-dialog";

/**
 * The "Links" control shared by the footer blocks.
 *
 * The list is edited in a dedicated dialog, like the navigation tree: the
 * properties panel keeps the shared header, its reset and a count of the links,
 * and nothing else. Keeping the header here means Link list and Copyright
 * expose the same label and reset affordance inside their own accordion.
 */
export const LinksSection = ({
  links,
  isModified,
  onReset,
  onChange,
}: {
  links?: LinkListItem[];
  isModified: boolean;
  onReset: () => void;
  onChange: (links: LinkListItem[]) => void;
}) => {
  const [open, setOpen] = useState(false);

  const items = links ?? [];

  return (
    <div className="flex flex-col gap-y-1">
      <PropHeader
        name="links"
        label="Links"
        isModified={isModified}
        onReset={onReset}
      />

      <div className="flex items-center justify-between gap-3 rounded-md border p-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs font-medium">
            {items.length} {items.length === 1 ? "link" : "links"}
          </span>
          <span className="text-xs text-muted-foreground">
            Edit the links in a dedicated dialog.
          </span>
        </div>
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={() => setOpen(true)}
        >
          <SettingsIcon data-icon="inline-start" />
          Edit links
        </Button>
      </div>

      <LinksDialog
        open={open}
        links={items}
        onOpenChange={setOpen}
        onSave={onChange}
      />
    </div>
  );
};
