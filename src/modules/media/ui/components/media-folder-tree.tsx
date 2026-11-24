"use client";

import { useState } from "react";
import {
  ChevronRight,
  Folder,
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderPlus,
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import type { MediaFolderNode } from "../../lib/media-folder";

export interface MediaFolderTreeProps {
  nodes: MediaFolderNode[];
  onCreateChild: (folder: MediaFolderNode) => void;
  onRename: (folder: MediaFolderNode) => void;
  onDelete: (folder: MediaFolderNode) => void;
  /**
   * Which branches are open. Omit both to let the tree hold its own state; the
   * sidebar controls it so a folder created under a collapsed branch can be
   * revealed. New branches start collapsed, so a deep library opens no branch
   * the editor did not ask for.
   */
  expandedIds?: ReadonlySet<string>;
  onExpandedChange?: (ids: ReadonlySet<string>) => void;
}

export const MediaFolderTree = ({
  nodes,
  onCreateChild,
  onRename,
  onDelete,
  expandedIds,
  onExpandedChange,
}: MediaFolderTreeProps) => {
  const [internalExpanded, setInternalExpanded] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const expanded = expandedIds ?? internalExpanded;
  const setExpanded = onExpandedChange ?? setInternalExpanded;

  const toggle = (id: string, open: boolean) => {
    const next = new Set(expanded);
    if (open) next.add(id);
    else next.delete(id);
    setExpanded(next);
  };

  return (
    <ul className="flex flex-col gap-y-0.5">
      {nodes.map((node) => (
        <MediaFolderTreeRow
          key={node.id}
          folder={node}
          depth={0}
          expanded={expanded}
          onToggle={toggle}
          onCreateChild={onCreateChild}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
};

interface MediaFolderTreeRowProps {
  folder: MediaFolderNode;
  depth: number;
  expanded: ReadonlySet<string>;
  onToggle: (id: string, open: boolean) => void;
  onCreateChild: (folder: MediaFolderNode) => void;
  onRename: (folder: MediaFolderNode) => void;
  onDelete: (folder: MediaFolderNode) => void;
}

const MediaFolderTreeRow = ({
  folder,
  depth,
  expanded,
  onToggle,
  onCreateChild,
  onRename,
  onDelete,
}: MediaFolderTreeRowProps) => {
  const open = expanded.has(folder.id);
  const hasChildren = folder.children.length > 0;

  return (
    <li>
      <Collapsible
        open={open}
        onOpenChange={(next) => onToggle(folder.id, next)}
      >
        <div
          className="group flex items-center gap-x-1 rounded-md pr-1 hover:bg-accent"
          style={{ paddingLeft: depth * 12 }}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`${open ? "Collapse" : "Expand"} ${folder.name}`}
              >
                <ChevronRight
                  className={`transition-transform ${open ? "rotate-90" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
          ) : (
            <span className="size-6 shrink-0" aria-hidden />
          )}
          <Folder className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate py-1 text-sm">
            {folder.name}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Actions for ${folder.name}`}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onCreateChild(folder)}>
                <FolderPlus />
                New subfolder
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onRename(folder)}>
                <Pencil />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => onDelete(folder)}
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {hasChildren && (
          <CollapsibleContent>
            <ul className="flex flex-col gap-y-0.5">
              {folder.children.map((child) => (
                <MediaFolderTreeRow
                  key={child.id}
                  folder={child}
                  depth={depth + 1}
                  expanded={expanded}
                  onToggle={onToggle}
                  onCreateChild={onCreateChild}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          </CollapsibleContent>
        )}
      </Collapsible>
    </li>
  );
};
