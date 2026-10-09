"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
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

import { useProductCategoriesFilters } from "../../../hooks/use-product-categories-filters";

interface ProductCategoriesActionProps {
  id: string;
}

export const ProductCategoriesActions = ({
  id,
}: ProductCategoriesActionProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [filters] = useProductCategoriesFilters();

  const canUpdate = usePermission(PERMISSIONS.PRODUCT_CATEGORIES_UPDATE);
  const canDelete = usePermission(PERMISSIONS.PRODUCT_CATEGORIES_DELETE);

  const removeCategory = useMutation(
    trpc.productCategories.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.productCategories.getMany.queryFilter(filters),
        );
        router.refresh();
        toast.success("Product category deleted successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onDelete = () => {
    removeCategory.mutate({ id });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <span className="sr-only">Open menu</span>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canUpdate && (
          <DropdownMenuItem asChild>
            <Link href={`/admin/shop/categories/${id}`}>
              <PencilIcon />
              Edit
            </Link>
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <ConfirmModal onConfirm={onDelete}>
              <Button
                variant="ghost"
                disabled={removeCategory.isPending}
                className="bg-destructive px-2! w-full justify-start text-destructive-foreground"
              >
                <Trash2Icon data-icon="inline-start" />
                Delete
              </Button>
            </ConfirmModal>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
