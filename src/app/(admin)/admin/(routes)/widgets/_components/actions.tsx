"use client";

import Link from "next/link";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

interface WidgetActions {
  id: string;
}

export const WidgetActions = ({ id }: WidgetActions) => {
  const router = useRouter();

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-4 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Link href={`/admin/widgets/${id}`}>
          <DropdownMenuItem>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <ConfirmModal onConfirm={onDelete}>
          <Button
            variant="ghost"
            className="text-destructive px-2 w-full justify-start"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </ConfirmModal>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
