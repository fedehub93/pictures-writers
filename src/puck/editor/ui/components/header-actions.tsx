"use client";

import Link from "next/link";
import { EyeIcon, EyeOffIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { createUsePuck } from "@puckeditor/core";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ContentStatus } from "@/generated/prisma";

import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";

import { config } from "@/puck/custom-config";

import { PageUpdateValues } from "@/modules/pages/schemas";
import { usePagesFilters } from "@/modules/pages/hooks/use-pages-filters";

const usePuck = createUsePuck<typeof config>();

interface HeaderActionsProps {
  page: {
    id: string;
    rootId: string;
    slug: string;
    status: ContentStatus;
  };
}

export const HeaderActions = ({ page }: HeaderActionsProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters, _] = usePagesFilters();

  const appState = usePuck((s) => s.appState);

  const updatePage = useMutation(
    trpc.pages.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pages.getMany.queryOptions(filters),
        );

        if (page.rootId) {
          await queryClient.invalidateQueries(
            trpc.pages.getLastByRootId.queryOptions({ rootId: page.rootId }),
          );
        }
        toast.success("Page updated successfully!");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onSave = async (values: PageUpdateValues) => {
    return updatePage.mutate(values);
  };

  const publishPage = useMutation(
    trpc.pages.publish.mutationOptions({
      onSuccess: async () => {
        queryClient.invalidateQueries(trpc.pages.getMany.queryFilter(filters));
        if (page.rootId) {
          await queryClient.invalidateQueries(
            trpc.pages.getLastByRootId.queryFilter({ rootId: page.rootId }),
          );
        }
        toast.success("Page published successfully");
      },
      onError: async (error) => {
        toast.error(error.message || "Failed to publish the page");
      },
    }),
  );

  const unPublishPage = useMutation(
    trpc.pages.unpublish.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pages.getMany.queryFilter(filters),
        );

        if (page.rootId) {
          await queryClient.invalidateQueries(
            trpc.pages.getLastByRootId.queryFilter({ rootId: page.rootId }),
          );
        }
        toast.success("Page unpublished successfully");
      },
      onError: async (error) => {
        toast.error(error.message || "Failed to unpublish the page");
      },
    }),
  );

  if (!page || !page.rootId) {
    return <Skeleton className="h-8 w-40" />;
  }

  const onTogglePublish = () => {
    const mustPublish = page.status !== ContentStatus.PUBLISHED;
    if (mustPublish) {
      return publishPage.mutate({ id: page.id, rootId: page.rootId });
    }
    return unPublishPage.mutate({ id: page.id });
  };

  const isSaving = updatePage.isPending;
  const isPublishing = publishPage.isPending || unPublishPage.isPending;

  return (
    <>
      <div className="flex items-center gap-2">
        <>
          <Button
            type="button"
            variant="ghost"
            className="text-xs h-8 px-3 flex items-center gap-2 text-slate-700 hover:text-foreground"
            asChild
          >
            <Link href={`/draft/${page.slug}`} target="_blank">
              <EyeIcon className="size-4" />
              Preview
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="text-xs h-8 px-3 flex items-center gap-2 text-slate-700 hover:text-foreground"
            disabled={isSaving || isPublishing}
            onClick={() =>
              onSave({
                id: page.id,
                rootId: page.rootId,
                puckData: appState.data,
              })
            }
          >
            {isSaving && <Loader2Icon className="size-4 animate-spin" />}
            {!isSaving && <SaveIcon className="size-4" />}
            Save
          </Button>
          <Button
            type="button"
            variant="secondary"
            className={cn(
              "text-xs h-8 px-3 flex items-center gap-2 text-primary-foreground bg-primary hover:bg-primary/90",
              page.status === ContentStatus.PUBLISHED && "bg-destructive",
            )}
            disabled={isSaving || isPublishing}
            onClick={() => onTogglePublish()}
          >
            {page.status !== ContentStatus.PUBLISHED && (
              <>
                {isPublishing && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                {!isPublishing && <EyeIcon className="size-4" />}
                Publish
              </>
            )}
            {page.status === ContentStatus.PUBLISHED && (
              <>
                {isPublishing && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                {!isPublishing && <EyeOffIcon className="size-4" />}
                Unpublish
              </>
            )}
          </Button>
        </>
      </div>
    </>
  );
};
