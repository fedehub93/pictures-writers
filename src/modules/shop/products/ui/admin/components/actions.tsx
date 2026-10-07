"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EyeIcon,
  EyeOffIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ContentStatus } from "@/generated/prisma";

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

import { useProductsFilters } from "../../../hooks/use-products-filters";

interface ProductsActionProps {
  id: string;
  rootId: string;
  status: ContentStatus;
}

export const ProductsActions = ({
  id,
  rootId,
  status,
}: ProductsActionProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [filters] = useProductsFilters();

  const canUpdate = usePermission(PERMISSIONS.PRODUCTS_UPDATE);
  const canPublish = usePermission(PERMISSIONS.PRODUCTS_PUBLISH);
  const canDelete = usePermission(PERMISSIONS.PRODUCTS_DELETE);

  const publishProduct = useMutation(
    trpc.products.publish.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.products.getMany.queryFilter(filters),
        );
        await queryClient.invalidateQueries(
          trpc.products.getLastByRootId.queryFilter({ rootId }),
        );
        router.refresh();
        toast.success("Product published successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const unpublishProduct = useMutation(
    trpc.products.unpublish.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.products.getMany.queryFilter(filters),
        );
        await queryClient.invalidateQueries(
          trpc.products.getLastByRootId.queryFilter({ rootId }),
        );
        router.refresh();
        toast.success("Product unpublished successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const removeProduct = useMutation(
    trpc.products.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.products.getMany.queryFilter(filters),
        );
        router.refresh();
        toast.success("Product deleted successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isPending =
    publishProduct.isPending ||
    unpublishProduct.isPending ||
    removeProduct.isPending;

  const onTogglePublish = () => {
    if (status === ContentStatus.PUBLISHED) {
      return unpublishProduct.mutate({ id });
    }
    return publishProduct.mutate({ id, rootId });
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
            <Link href={`/admin/shop/products/${rootId}`}>
              <PencilIcon />
              Edit
            </Link>
          </DropdownMenuItem>
        )}
        {canPublish && (
          <DropdownMenuItem onSelect={onTogglePublish} disabled={isPending}>
            {status === ContentStatus.PUBLISHED ? (
              <>
                <EyeOffIcon />
                Unpublish
              </>
            ) : (
              <>
                <EyeIcon />
                Publish
              </>
            )}
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <ConfirmModal onConfirm={() => removeProduct.mutate({ id })}>
              <Button
                variant="ghost"
                disabled={isPending}
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
