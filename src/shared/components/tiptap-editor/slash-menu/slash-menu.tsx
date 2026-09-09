"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/shared/lib/utils";

import { groupSlashCommands, slashCommandGroups } from "./slash-commands";
import type { SlashCommand } from "./types";

export interface SlashMenuProps {
  items: SlashCommand[];
  command: (command: SlashCommand) => void;
}

export interface SlashMenuHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

const optionId = (item: SlashCommand) => `slash-command-${item.id}`;

export const SlashMenu = forwardRef<SlashMenuHandle, SlashMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Reset selection and refs whenever the visible items change.
    useEffect(() => {
      setSelectedIndex(0);
      itemRefs.current = [];
    }, [items]);

    // Keep the selected item visible.
    useEffect(() => {
      itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }, [selectedIndex]);

    const handleSelect = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) command(item);
      },
      [items, command],
    );

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: (event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelectedIndex((index) =>
              items.length === 0
                ? 0
                : (index - 1 + items.length) % items.length,
            );
            return true;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelectedIndex((index) =>
              items.length === 0 ? 0 : (index + 1) % items.length,
            );
            return true;
          }

          if (event.key === "Enter") {
            event.preventDefault();
            if (items.length > 0) {
              handleSelect(selectedIndex);
            }
            return true;
          }

          return false;
        },
      }),
      [items, selectedIndex, handleSelect],
    );

    const grouped = useMemo(() => groupSlashCommands(items), [items]);
    const selectedItem = items[selectedIndex];

    const setItemRef = useCallback(
      (index: number) => (el: HTMLButtonElement | null) => {
        itemRefs.current[index] = el;
      },
      [],
    );

    return (
      <div
        className="z-50 w-64 overflow-hidden rounded-md border bg-popover p-1 shadow-md"
        role="listbox"
        aria-label="Slash commands"
        aria-activedescendant={
          selectedItem ? optionId(selectedItem) : undefined
        }
      >
        {items.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">
            No results found.
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            {(() => {
              let flatIndex = 0;
              return grouped.map(([group, groupItems], groupIndex) => (
                <div
                  key={group}
                  role="group"
                  aria-label={slashCommandGroups[group]}
                >
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {slashCommandGroups[group]}
                  </div>
                  {groupItems.map((item) => {
                    const currentIndex = flatIndex++;
                    const isSelected = currentIndex === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        id={optionId(item)}
                        ref={setItemRef(currentIndex)}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        aria-label={`${item.label}: ${item.description}`}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-hidden transition-colors",
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent hover:text-accent-foreground",
                        )}
                        onClick={() => handleSelect(currentIndex)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                      >
                        <Icon
                          className="size-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                      </button>
                    );
                  })}
                  {groupIndex < grouped.length - 1 && (
                    <div className="my-1 h-px bg-border" />
                  )}
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    );
  },
);

SlashMenu.displayName = "SlashMenu";
