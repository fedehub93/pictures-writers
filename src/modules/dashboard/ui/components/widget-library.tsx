"use client";

import { useState } from "react";
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

interface WidgetLibraryTileProps {
  /** The definitions the current user is permitted to add. */
  definitions: WidgetDefinition[];
  onSelect: (definitionId: string) => void;
}

/**
 * The `+` tile at the end of the grid. Opens a library of the permitted widget
 * definitions; picking one adds an instance to the draft layout.
 */
export const WidgetLibraryTile = ({
  definitions,
  onSelect,
}: WidgetLibraryTileProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-full min-h-32 w-full flex-col gap-2 border-dashed text-muted-foreground"
        >
          <Plus className="size-6" />
          Aggiungi widget
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi widget</DialogTitle>
          <DialogDescription>
            Scegli un widget da aggiungere alla tua dashboard.
          </DialogDescription>
        </DialogHeader>

        {definitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nessun widget disponibile.
          </p>
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
