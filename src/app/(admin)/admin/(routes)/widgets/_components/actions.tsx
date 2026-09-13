"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";
import { usePermission } from "@/shared/providers/authorization-provider";
import { PERMISSIONS } from "@/shared/lib/permissions";

interface WidgetActions {
  id: string;
}

export const WidgetActions = ({ id }: WidgetActions) => {
  const router = useRouter();
  const canManage = usePermission(PERMISSIONS.WIDGETS_MANAGE);

  const onDelete = async () => {
    try {
      await axios.delete(`/api/admin/widgets/${id}`);

      toast.success("Item deleted!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  return canManage ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Link href={`/admin/widgets/${id}`}>
          <DropdownMenuItem>
            <Pencil />
            Edit
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <ConfirmModal onConfirm={onDelete}>
          <Button
            variant="ghost"
            className="text-destructive px-2 w-full justify-start"
          >
            <Trash2 data-icon="inline-start" />
            Delete
          </Button>
        </ConfirmModal>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;
};
