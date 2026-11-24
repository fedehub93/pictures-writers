"use client";

import { Plus } from "lucide-react";

import { usePermission } from "@/shared/providers/authorization-provider";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { Button } from "@/shared/ui/button";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

/**
 * The library's upload action. The picker renders the same component, so the
 * two surfaces cannot drift — including their create-permission gate.
 */
export const MediaCreateAction = ({
  className,
  folderId = null,
}: {
  className?: string;
  /** The folder the open library view is showing; the upload is filed there. */
  folderId?: string | null;
}) => {
  const { onOpen } = useModal();
  const canCreate = usePermission(PERMISSIONS.MEDIA_CREATE);

  if (!canCreate) return null;

  return (
    <Button
      className={className}
      onClick={() => onOpen("createMediaAsset", undefined, { folderId })}
    >
      <Plus />
      Upload Media
    </Button>
  );
};
