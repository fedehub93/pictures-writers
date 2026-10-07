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

import { useProductCategoriesFilters } from "../../../hooks/use-product-categories-filters";

interface ProductCategoriesActionProps {
  id: string;
  rootId: string;
  status: ContentStatus;
}

export const ProductCategoriesActions = ({
  id,
  rootId,
  status,
}: ProductCategoriesActionProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [filters] = useProductCategoriesFilters();

  const canUpdate = usePermission(PERMISSIONS.PRODUCT_CATEGORIES_UPDATE);
  const canPublish = usePermission(PERMISSIONS.PRODUCT_CATEGORIES_PUBLISH);
  const canDelete = usePermission(PERMISSIONS.PRODUCT_CATEGORIES_DELETE);

  const publishCategory = useMutation(
    trpc.productCategories.publish.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.productCategories.getMany.queryFilter(filters),
        );
        await queryClient.invalidateQueries(
          trpc.productCategories.getLastByRootId.queryFilter({ rootId }),
        );
        router.refresh();
        toast.success("Category published successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const unpublishCategory = useMutation(
    trpc.productCategories.unpublish.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.productCategories.getMany.queryFilter(filters),
        );
        await queryClient.invalidateQueries(
          trpc.productCategories.getLastByRootId.queryFilter({ rootId }),
        );
        router.refresh();
        toast.success("Category unpublished successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const removeCategory = useMutation(
    trpc.productCategories.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.productCategories.getMany.queryFilter(filters),
        );
        router.refresh();
        toast.success("Category deleted successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isPending =
    publishCategory.isPending ||
    unpublishCategory.isPending ||
    removeCategory.isPending;

  const onTogglePublish = () => {
    if (status === ContentStatus.PUBLISHED) {
      return unpublishCategory.mutate({ id });
    }
    return publishCategory.mutate({ id, rootId });
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
            <Link href={`/admin/shop/categories/${rootId}`}>
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
            <ConfirmModal
              onConfirm={() => removeCategory.mutate({ id })}
            >
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
