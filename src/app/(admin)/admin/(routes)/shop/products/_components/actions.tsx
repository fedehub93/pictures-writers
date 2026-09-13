"use client";

import Link from "next/link";
import axios from "axios";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";
import { API_ADMIN_PRODUCTS } from "@/constants/api";
import { usePermission } from "@/shared/providers/authorization-provider";
import { PERMISSIONS } from "@/shared/lib/permissions";

export const ProductsAction = ({
  id,
  rootId,
}: {
  id: string;
  rootId: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [_isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const canUpdate = usePermission(PERMISSIONS.PRODUCTS_UPDATE);
  const canDelete = usePermission(PERMISSIONS.PRODUCTS_DELETE);

  const onDelete = async () => {
    try {
      setIsLoading(true);

      await axios.delete(`${API_ADMIN_PRODUCTS}/${rootId}/versions/${id}`);

      toast.success("Item deleted!");
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
          size="icon"
          className="size-8"
          onClick={() => {
            setIsOpen(true);
          }}
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canUpdate && <Link href={`/admin/shop/products/${rootId}`}>
          <DropdownMenuItem>
            <Pencil />
            Edit
          </DropdownMenuItem>
        </Link>}
        {(canUpdate && canDelete) && <DropdownMenuSeparator />}
        {canDelete && <ConfirmModal onConfirm={onDelete}>
          <Button
            variant="ghost"
            className="text-destructive px-2 w-full justify-start"
          >
            <Trash2 data-icon="inline-start" />
            Delete
          </Button>
        </ConfirmModal>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
