"use client";

import "client-only";

import { useRouter } from "next/navigation";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";

import { PERMISSIONS } from "@/shared/lib/permissions";
import { usePermission } from "@/shared/providers/authorization-provider";
import { Button } from "@/shared/ui/button";

import type { SiteRegionSummary } from "../../lib/region-presentation";
import { useSiteRegionPublishing } from "../hooks/use-site-region-publishing";

export const SiteRegionPublishAction = ({
  region,
}: {
  region: SiteRegionSummary;
}) => {
  const router = useRouter();
  const canPublish = usePermission(PERMISSIONS.SITE_LAYOUT_PUBLISH);
  const refreshList = () => router.refresh();

  const { publish, unpublish, isPublishing } = useSiteRegionPublishing({
    onPublished: refreshList,
    onUnpublished: refreshList,
  });

  const { rootId, currentVersionId, status } = region;

  if (!canPublish || !rootId || !currentVersionId || !status) {
    return null;
  }

  const isPublished = status === "PUBLISHED";

  const onClick = () => {
    if (isPublished) {
      unpublish.mutate({ key: region.key });
      return;
    }

    publish.mutate({ id: currentVersionId, rootId });
  };

  return (
    <Button
      type="button"
      variant={isPublished ? "destructive" : "default"}
      size="sm"
      disabled={isPublishing}
      onClick={onClick}
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
  );
};
