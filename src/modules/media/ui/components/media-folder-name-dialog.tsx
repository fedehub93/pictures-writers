"use client";

import { useState } from "react";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { MAX_MEDIA_FOLDER_NAME_LENGTH } from "../../constants";

interface MediaFolderNameDialogProps {
  open: boolean;
  mode: "create" | "rename";
  initialName?: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
}

export const MediaFolderNameDialog = ({
  open,
  mode,
  initialName = "",
  isPending,
  onOpenChange,
  onSubmit,
}: MediaFolderNameDialogProps) => {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed || isPending) return;
    onSubmit(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New folder" : "Rename folder"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Folders nest, so you can group related Media at any depth."
              : "The folder keeps its place in the tree."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="media-folder-name">Name</Label>
            <Input
              id="media-folder-name"
              autoFocus
              maxLength={MAX_MEDIA_FOLDER_NAME_LENGTH}
              value={name}
              disabled={isPending}
              onChange={(event) => setName(event.target.value)}
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
            <Button type="submit" disabled={!trimmed || isPending}>
              {mode === "create" ? "Create folder" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
