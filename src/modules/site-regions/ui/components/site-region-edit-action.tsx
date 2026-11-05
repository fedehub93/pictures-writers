"use client";

import "client-only";

import Link from "next/link";
import { PencilIcon } from "lucide-react";

import type { SiteRegionKey } from "@/generated/prisma";

import { PERMISSIONS } from "@/shared/lib/permissions";
import { usePermission } from "@/shared/providers/authorization-provider";
import { Button } from "@/shared/ui/button";

/**
 * Opening the editor creates the region root on first visit and allows saving,
 * so the entry point is gated by the update permission rather than read.
 */
export const SiteRegionEditAction = ({
  regionKey,
}: {
  regionKey: SiteRegionKey;
}) => {
  const canUpdate = usePermission(PERMISSIONS.SITE_LAYOUT_UPDATE);

  if (!canUpdate) {
    return null;
  }

  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={`/admin/site-regions/${regionKey}`}>
        <PencilIcon data-icon="inline-start" />
        Edit layout
      </Link>
    </Button>
  );
};
