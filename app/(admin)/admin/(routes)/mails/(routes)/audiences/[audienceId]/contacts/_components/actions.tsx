"use client";

import Link from "next/link";
import axios from "axios";
import {
  CloudSyncIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

export const EmailAudienceContactsAction = ({ id }: { id: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onDelete = async () => {
    try {
      setIsLoading(true);

      await axios.delete(`/api/mails/contacts/${id}`);

      toast.success("Item deleted!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const onSyncWithProvider = async () => {
    try {
      setIsLoading(true);

      const res = await fetch(`/api/admin/mails/contacts/${id}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unknown error");

      toast.success("Sync completed");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-4 w-8 p-0"
          onClick={() => {
            setIsOpen(true);
          }}
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Link href={`/admin/mails/contacts/${id}`}>
          <DropdownMenuItem disabled={isLoading}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        </Link>
        <ConfirmModal onConfirm={onSyncWithProvider}>
          <Button
            variant="ghost"
            className="px-2! w-full justify-start gap-0"
            disabled={isLoading}
          >
            <CloudSyncIcon className="size-4 mr-2" />
            Sync with Provider
          </Button>
        </ConfirmModal>
        <DropdownMenuSeparator />
        <ConfirmModal onConfirm={onDelete}>
          <Button
            variant="ghost"
            className="bg-destructive px-2! w-full justify-start text-destructive-foreground gap-0"
            disabled={isLoading}
          >
            <Trash2Icon className="size-4 mr-2" />
            Delete
          </Button>
        </ConfirmModal>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
