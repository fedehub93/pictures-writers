"use client";

import {
  FolderPenIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { usePermission } from "@/shared/providers/authorization-provider";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { useAutomationsFilters } from "../../../hooks/use-automations-filters";
import { useOpenAutomation } from "../../../hooks/use-open-automation";
import Link from "next/link";

interface AutomationActionsProps {
  id: string;
  name: string;
}

export const AutomationActions = ({ id, name }: AutomationActionsProps) => {
  const trpc = useTRPC();
  const canWrite = usePermission(PERMISSIONS.AUTOMATIONS_WRITE);
  const { onOpen } = useOpenAutomation();

  const queryClient = useQueryClient();
  const [filters, _] = useAutomationsFilters();

  const removeAutomation = useMutation(
    trpc.automations.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.automations.getMany.queryFilter(filters),
        );
        toast.success("Automation deleted successfully!");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onDelete = async () => {
    removeAutomation.mutate({ id });
  };

  const { isPending } = removeAutomation;

  if (!canWrite) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <span className="sr-only">Open menu</span>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onOpen({ id, name })}>
          <FolderPenIcon />
          Rename
        </DropdownMenuItem>
        {canWrite && (
          <Link href={`/admin/automations/${id}/`}>
            <DropdownMenuItem>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
          </Link>
        )}
        <DropdownMenuSeparator />
        <ConfirmModal onConfirm={onDelete}>
          <Button
            variant="ghost"
            disabled={isPending}
            className="bg-destructive px-2! w-full justify-start text-destructive-foreground"
          >
            <Trash2Icon data-icon="inline-start" />
            Delete
          </Button>
        </ConfirmModal>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
