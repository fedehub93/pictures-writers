"use client";
import "client-only";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/shared/ui/button";

import {
  createLinkListItem,
  EMPTY_LINK,
  moveLinkListItem,
  removeLinkListItem,
  updateLinkListItem,
} from "../lib/links";
import { normalizeLinkProps, type LinkListItem } from "../types";
import { LinkView } from "./view/link-view";

/**
 * Shared inline editor for a list of SmartLinks.
 *
 * The footer blocks (Link list, Copyright) both need the same add, remove,
 * reorder and edit behaviour, but Puck's native array field cannot live inside
 * the block's custom content accordion. This component renders the rows
 * inline and reuses `LinkView`, so SmartLink targets are picked and resolved
 * exactly like the standalone Link field.
 */
export const LinksEditor = ({
  links = [],
  onChange,
}: {
  links?: LinkListItem[];
  onChange: (links: LinkListItem[]) => void;
}) => {
  return (
    <div className="flex flex-col gap-2 p-1">
      {links.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Add a link to build the list.
        </p>
      ) : null}

      {links.map((item, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 rounded-md border p-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-medium text-muted-foreground">
              {item?.link?.label?.trim() || `Link ${index + 1}`}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Move link up"
                disabled={index === 0}
                onClick={() =>
                  onChange(moveLinkListItem(links, index, -1))
                }
              >
                <ArrowUpIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Move link down"
                disabled={index === links.length - 1}
                onClick={() =>
                  onChange(moveLinkListItem(links, index, 1))
                }
              >
                <ArrowDownIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Remove link"
                onClick={() => onChange(removeLinkListItem(links, index))}
              >
                <Trash2Icon />
              </Button>
            </div>
          </div>

          <LinkView
            idPrefix={`link-${index}-`}
            state={normalizeLinkProps(item?.link) ?? EMPTY_LINK}
            onUpdate={(link) =>
              onChange(updateLinkListItem(links, index, { link }))
            }
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={() => onChange([...links, createLinkListItem()])}
      >
        <PlusIcon data-icon="inline-start" />
        Add link
      </Button>
    </div>
  );
};
