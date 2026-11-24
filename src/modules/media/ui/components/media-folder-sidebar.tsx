"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { Archive, HardDrive, type LucideIcon } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Skeleton } from "@/shared/ui/skeleton";

import { DEFAULT_PAGE, type MediaLibraryView } from "../../constants";
import { useMediaFolderTree, useMediaMeta } from "../../hooks/use-media";
import { useMediaFilters } from "../../hooks/use-media-filters";
import { useMediaInvalidation } from "../../hooks/use-media-invalidation";
import { mediaErrorMessage } from "../../lib/error-message";
import {
  openMediaFolderId,
  type MediaFolderNode,
} from "../../lib/media-folder";

import { MediaFolderTree } from "./media-folder-tree";
import { MediaStorageDetails } from "./media-storage-details";
import { useMediaFolderDialog } from "./media-folder-dialog-provider";

/**
 * The library's navigation: My Drive with its folder tree, plus the Archived
 * view, with the storage details beneath them. It reads the nested tree the
 * server built and owns folder deletion; create and rename live in the shared
 * dialog provider so the header's "New Folder" action can open the same
 * surface. The presentational tree only reports the row an action named, so the
 * same components render without a router in a test.
 */
export const MediaFolderSidebar = () => {
  const trpc = useTRPC();
  const { data, isPending, isError, refetch } = useMediaFolderTree();
  const { invalidateFolders, invalidateLibrary } = useMediaInvalidation();
  const [filters, setFilters] = useMediaFilters();
  const { openCreate, openRename } = useMediaFolderDialog();
  // The storage widget is beside navigation, so it shows the installation's
  // whole budget rather than the open scope. It shares the header's read, so
  // the two cost one request.
  const { data: meta } = useMediaMeta({
    search: filters.search,
    view: filters.view,
    folderId: filters.folderId,
  });

  const remove = useMutation(trpc.media.deleteFolder.mutationOptions());

  const [deleteTarget, setDeleteTarget] = useState<MediaFolderNode | null>(
    null,
  );
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const isDeleting = remove.isPending;

  // Every navigation returns to page one: a page number only exists inside the
  // scope it was counted in.
  const openView = (view: MediaLibraryView) =>
    setFilters({ view, folderId: null, page: DEFAULT_PAGE });
  const openFolder = (folder: MediaFolderNode) => {
    setFilters({ view: "active", folderId: folder.id, page: DEFAULT_PAGE });
    // The branch opens with the folder, so the highlighted row is on screen.
    setExpandedIds((current) => new Set(current).add(folder.id));
  };

  const selectedFolderId = openMediaFolderId(filters);

  const onDelete = () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;

    const run = async () => {
      try {
        await remove.mutateAsync({ id });
        // The grid draws the child folders too, so a folder write refreshes both
        // reads: the tree and the folder cards, which getMany owns.
        await Promise.all([invalidateFolders(), invalidateLibrary()]);
        setExpandedIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
        // The grid cannot stay pointed at a folder that no longer exists.
        if (filters.folderId === id) openView("active");
        setDeleteTarget(null);
        toast.success("Folder deleted");
      } catch (error) {
        toast.error(mediaErrorMessage(error));
      }
    };

    void run();
  };

  return (
    <aside
      aria-label="Media folders"
      className="w-64 shrink-0 border-r pr-4"
    >
      <button
        type="button"
        onClick={() => openView("active")}
        aria-current={
          filters.view === "active" && !filters.folderId ? "page" : undefined
        }
        className={`flex w-full items-center gap-x-2 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-accent ${
          filters.view === "active" && !filters.folderId
            ? "bg-accent font-medium"
            : ""
        }`}
      >
        <HardDrive className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">My Drive</span>
      </button>

      <ScrollArea className="mt-2 max-h-[calc(100vh-18rem)]">
        {isPending && (
          <div className="flex flex-col gap-y-2 py-1">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-6 w-3/5" />
          </div>
        )}

        {isError && (
          <div className="py-2 text-xs text-muted-foreground">
            The folders could not be loaded.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => void refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {data &&
          (data.length > 0 ? (
            <MediaFolderTree
              nodes={data}
              expandedIds={expandedIds}
              onExpandedChange={setExpandedIds}
              onCreateChild={(folder) => {
                openCreate(folder.id, () => {
                  // The new branch must be visible where the action was taken;
                  // its own row is already on screen, so only the parent opens.
                  setExpandedIds((current) =>
                    new Set(current).add(folder.id),
                  );
                });
              }}
              onRename={openRename}
              onDelete={setDeleteTarget}
              onSelect={openFolder}
              selectedId={selectedFolderId}
            />
          ) : (
            <p className="py-2 text-xs text-muted-foreground">
              No folders yet. Create one to group related Media.
            </p>
          ))}
      </ScrollArea>

      <nav
        aria-label="Library views"
        className="mt-2 flex flex-col gap-y-0.5 border-t pt-2"
      >
        <SidebarNavItem
          active={filters.view === "archived"}
          icon={Archive}
          label="Archived"
          onClick={() => openView("archived")}
        />
      </nav>

      {meta && (
        <MediaStorageDetails
          quota={meta.quota}
          byMediaType={meta.byMediaType}
        />
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete “{deleteTarget?.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Only an empty folder can be deleted. Move its Media and remove its
              subfolders first; this refusal protects organized assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                onDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};

/**
 * The flat views beside the tree. They are buttons, not links: the library
 * lives in query state, so switching a view must not reload the page.
 */
const SidebarNavItem = ({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    className={`flex w-full items-center gap-x-2 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-accent ${
      active ? "bg-accent font-medium" : ""
    }`}
  >
    <Icon className="size-4 shrink-0 text-muted-foreground" />
    <span className="truncate">{label}</span>
  </button>
);
