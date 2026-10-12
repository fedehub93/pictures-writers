"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";

import type { WidgetDefinition } from "../../types";

interface WidgetLibraryProps {
  /** The definitions the current user is permitted to add. */
  definitions: WidgetDefinition[];
  onSelect: (definitionId: string) => void;
  /** The element that opens the library. */
  children: ReactNode;
}

/**
 * The widget library dialog. It lists the permitted widget definitions and adds
 * the chosen one to the layout. The trigger is supplied by the caller so the
 * same library backs both the grid's `+` tile and the empty-dashboard prompt.
 */
export const WidgetLibrary = ({
  definitions,
  onSelect,
  children,
}: WidgetLibraryProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add widget</DialogTitle>
          <DialogDescription>
            Choose a widget to add to your dashboard.
          </DialogDescription>
        </DialogHeader>

        {definitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No widgets available.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {definitions.map((definition) => {
              const Icon = definition.icon;

              return (
                <li key={definition.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors hover:bg-accent"
                    onClick={() => {
                      onSelect(definition.id);
                      setOpen(false);
                    }}
                  >
                    <Icon className="size-5 shrink-0 text-muted-foreground" />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium">
                        {definition.title}
                      </span>
                      {definition.description ? (
                        <span className="text-xs text-muted-foreground">
                          {definition.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface WidgetLibraryTileProps {
  definitions: WidgetDefinition[];
  onSelect: (definitionId: string) => void;
}

/** The `+` tile at the end of the grid; opens the widget library. */
export const WidgetLibraryTile = ({
  definitions,
  onSelect,
}: WidgetLibraryTileProps) => (
  <WidgetLibrary definitions={definitions} onSelect={onSelect}>
    <Button
      type="button"
      variant="outline"
      className="h-full min-h-32 w-full flex-col gap-2 border-dashed text-muted-foreground"
    >
      <Plus className="size-6" />
      Add widget
    </Button>
  </WidgetLibrary>
);
