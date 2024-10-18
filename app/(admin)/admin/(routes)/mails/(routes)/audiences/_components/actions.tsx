"use client";

import Link from "next/link";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";
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

interface AudiencesAction {
  id: string;
  isAllContactsAudience: boolean;
}

export const AudiencesAction = ({
  id,
  isAllContactsAudience,
}: AudiencesAction) => {
  const router = useRouter();

  const onDelete = async () => {
    try {
      await axios.delete(`/api/mails/audiences/${id}`);

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
        {!isAllContactsAudience && (
          <Link href={`/admin/mails/audiences/${id}`}>
            <DropdownMenuItem>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          </Link>
        )}
        <Link href={`/admin/mails/audiences/${id}/contacts`}>
          <DropdownMenuItem>
            <Eye className="h-4 w-4 mr-2" />
            View contacts
          </DropdownMenuItem>
        </Link>
        {!isAllContactsAudience && (
          <>
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
