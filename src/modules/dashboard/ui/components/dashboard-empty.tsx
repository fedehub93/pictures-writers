"use client";

import { LayoutDashboard, Plus } from "lucide-react";

import type { WidgetDefinition } from "@/shared/dashboard/types";

import { WidgetLibrary } from "./widget-library";

interface DashboardEmptyProps {
  /** The definitions the current user is permitted to add. */
  definitions: WidgetDefinition[];
  onSelect: (definitionId: string) => void;
}

/**
 * The dashboard's empty state: shown whenever the user has no widget. Its only
 * action is the library, which doubles as the first-run prompt.
 */
export const DashboardEmpty = ({ definitions, onSelect }: DashboardEmptyProps) => {
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <WidgetLibrary definitions={definitions} onSelect={onSelect}>
        <button
          type="button"
          className="flex w-full max-w-md flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center transition-colors hover:bg-accent"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <LayoutDashboard className="size-5" />
          </span>
          <span className="flex flex-col gap-1">
            <span className="font-medium">Your dashboard is empty</span>
            <span className="text-sm text-muted-foreground">
              Add a widget to start tracking what matters.
            </span>
          </span>
          <span className="mt-1 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium">
            <Plus className="size-4" />
            Add widget
          </span>
        </button>
      </WidgetLibrary>
    </div>
  );
};
