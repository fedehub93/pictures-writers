"use client";

import { Fragment, useState } from "react";
import { Folder, HardDrive, type LucideIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import type { MediaFolderNode } from "../../lib/media-folder";
import { mediaFolderName } from "../../lib/media-folder";

interface MediaMoveDialogProps {
  open: boolean;
  /** How many Media the move files; the title states the batch. */
  count: number;
  folders: MediaFolderNode[];
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  /** The chosen folder, or null for the My Drive root. */
  onConfirm: (folderId: string | null) => void;
}

/**
 * The folder the editor wants the selection filed into. The tree is drawn
 * indented rather than collapsible: every folder is a target, and a hidden
 * branch would read as a folder that cannot be chosen. My Drive is preselected
 * because it is always a valid target, so the confirm action is never a dead
 * end.
 */
export const MediaMoveDialog = ({
  open,
  count,
  folders,
  isPending,
  onOpenChange,
  onConfirm,
}: MediaMoveDialogProps) => {
  const [targetId, setTargetId] = useState<string | null>(null);

  const targetName = targetId ? mediaFolderName(folders, targetId) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move {count} Media</DialogTitle>
          <DialogDescription>
            Choose the folder to file the selection into. My Drive is the
            library root, where Media without a folder live.
          </DialogDescription>
        </DialogHeader>
        <div
          role="listbox"
          aria-label="Folders"
          className="max-h-64 overflow-y-auto rounded-md border p-1"
        >
          <FolderOption
            selected={targetId === null}
            icon={HardDrive}
            label="My Drive"
            description="Library root"
            disabled={isPending}
            onSelect={() => setTargetId(null)}
          />
          <FolderOptions
            nodes={folders}
            depth={0}
            targetId={targetId}
            disabled={isPending}
            onSelect={setTargetId}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => onConfirm(targetId)}
          >
            {targetName ? `Move to ${targetName}` : "Move to My Drive"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface FolderOptionsProps {
  nodes: MediaFolderNode[];
  depth: number;
  targetId: string | null;
  disabled: boolean;
  onSelect: (folderId: string) => void;
}

function FolderOptions({
  nodes,
  depth,
  targetId,
  disabled,
  onSelect,
}: FolderOptionsProps) {
  return nodes.map((node) => (
    <Fragment key={node.id}>
      <FolderOption
        selected={targetId === node.id}
        depth={depth}
        icon={Folder}
        label={node.name}
        disabled={disabled}
        onSelect={() => onSelect(node.id)}
      />
      {node.children.length > 0 && (
        <FolderOptions
          nodes={node.children}
          depth={depth + 1}
          targetId={targetId}
          disabled={disabled}
          onSelect={onSelect}
        />
      )}
    </Fragment>
  ));
}

interface FolderOptionProps {
  selected: boolean;
  depth?: number;
  icon: LucideIcon;
  label: string;
  description?: string;
  disabled: boolean;
  onSelect: () => void;
}

function FolderOption({
  selected,
  depth = 0,
  icon: Icon,
  label,
  description,
  disabled,
  onSelect,
}: FolderOptionProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      disabled={disabled}
      onClick={onSelect}
      style={{ paddingLeft: 8 + depth * 16 }}
      className={`flex w-full items-center gap-x-2 rounded-sm py-1.5 pr-2 text-left text-sm transition hover:bg-accent disabled:opacity-50 ${
        selected ? "bg-accent font-medium" : ""
      }`}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate">{label}</span>
      {description && (
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {description}
        </span>
      )}
    </button>
  );
}
