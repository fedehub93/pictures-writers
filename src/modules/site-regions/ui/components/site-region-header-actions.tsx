"use client";

import "client-only";

import { useState } from "react";
import { EyeIcon, EyeOffIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { createUsePuck, type Config } from "@puckeditor/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

import {
  getSiteRegionStatusLabel,
  getSiteRegionStatusVariant,
} from "../../lib/region-presentation";
import { useSiteRegionPublishing } from "../hooks/use-site-region-publishing";
import type { SiteRegionEditorState } from "../types";

const usePuck = createUsePuck<Config>();

export const SiteRegionHeaderActions = ({
  region,
}: {
  region: SiteRegionEditorState;
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const appState = usePuck((state) => state.appState);
  const [editorState, setEditorState] = useState(region);

  const isPublished = editorState.version.status === "PUBLISHED";
  const regionKey = editorState.key;

  const invalidateRegionQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries(
        trpc.siteRegions.getCurrent.queryFilter({ key: regionKey }),
      ),
      queryClient.invalidateQueries(
        trpc.siteRegions.getVersions.queryFilter({ key: regionKey }),
      ),
      queryClient.invalidateQueries(
        trpc.siteRegions.getByKey.queryFilter({ key: regionKey }),
      ),
    ]);
  };

  const updateRegion = useMutation(
    trpc.siteRegions.update.mutationOptions({
      onSuccess: async (saved) => {
        setEditorState((current) => ({
          ...current,
          rootId: saved.rootId,
          version: {
            id: saved.id,
            version: saved.version,
            status: saved.status,
          },
        }));
        await invalidateRegionQueries();
        toast.success("Layout saved.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not save the layout.");
      },
    }),
  );

  const { publish, unpublish, isPublishing } = useSiteRegionPublishing({
    onPublished: async (published) => {
      setEditorState((current) => ({
        ...current,
        version: published,
      }));
      await invalidateRegionQueries();
    },
    onUnpublished: async () => {
      setEditorState((current) => ({
        ...current,
        version: { ...current.version, status: "CHANGED" },
      }));
      await invalidateRegionQueries();
    },
  });

  const isSaving = updateRegion.isPending;
  const isBusy = isSaving || isPublishing;

  const onSave = () => {
    updateRegion.mutate({
      id: editorState.version.id,
      rootId: editorState.rootId,
      puckData: appState.data,
    });
  };

  const onTogglePublish = () => {
    if (isPublished) {
      unpublish.mutate({ key: editorState.key });
      return;
    }

    publish.mutate({
      id: editorState.version.id,
      rootId: editorState.rootId,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getSiteRegionStatusVariant(editorState.version.status)}>
        v{editorState.version.version} ·{" "}
        {getSiteRegionStatusLabel(editorState.version.status)}
      </Badge>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isBusy}
        onClick={onSave}
      >
        {isSaving ? (
          <Loader2Icon data-icon="inline-start" className="animate-spin" />
        ) : (
          <SaveIcon data-icon="inline-start" />
        )}
        Save
      </Button>

      <Button
        type="button"
        variant={isPublished ? "destructive" : "default"}
        size="sm"
        disabled={isBusy}
        onClick={onTogglePublish}
      >
        {isPublishing ? (
          <Loader2Icon data-icon="inline-start" className="animate-spin" />
        ) : isPublished ? (
          <EyeOffIcon data-icon="inline-start" />
        ) : (
          <EyeIcon data-icon="inline-start" />
        )}
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
    </div>
  );
};
