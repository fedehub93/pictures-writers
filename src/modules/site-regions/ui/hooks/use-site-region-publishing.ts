"use client";

import "client-only";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import type { SiteRegionEditorVersion } from "../types";

interface UseSiteRegionPublishingOptions {
  onPublished?: (
    version: SiteRegionEditorVersion,
  ) => void | Promise<void>;
  onUnpublished?: () => void | Promise<void>;
}

/**
 * Publish/unpublish mutations shared by the editor header and the admin list.
 * Each caller supplies its own post-success behaviour (update local state and
 * invalidate queries, or refresh the server-rendered list).
 */
export function useSiteRegionPublishing({
  onPublished,
  onUnpublished,
}: UseSiteRegionPublishingOptions = {}) {
  const trpc = useTRPC();

  const publish = useMutation(
    trpc.siteRegions.publish.mutationOptions({
      onSuccess: async (published) => {
        toast.success("Layout published.");
        await onPublished?.({
          id: published.id,
          version: published.version,
          status: published.status,
        });
      },
      onError: (error) => {
        toast.error(error.message || "Could not publish the layout.");
      },
    }),
  );

  const unpublish = useMutation(
    trpc.siteRegions.unpublish.mutationOptions({
      onSuccess: async () => {
        toast.success("Layout unpublished.");
        await onUnpublished?.();
      },
      onError: (error) => {
        toast.error(error.message || "Could not unpublish the layout.");
      },
    }),
  );

  return {
    publish,
    unpublish,
    isPublishing: publish.isPending || unpublish.isPending,
  };
}
