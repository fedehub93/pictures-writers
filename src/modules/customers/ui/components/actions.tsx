"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLinkIcon,
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

import { useOpenCustomer, type CustomerListItem } from "../../hooks/use-open-customer";
import { useCustomerFilters } from "../../hooks/use-customers-filter";

interface CustomersActionsProps {
  data: CustomerListItem;
}

export const CustomersActions = ({ data }: CustomersActionsProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [filters] = useCustomerFilters();
  const { onOpen } = useOpenCustomer();

  const canUpdate = usePermission(PERMISSIONS.CUSTOMERS_UPDATE);
  const canDelete = usePermission(PERMISSIONS.CUSTOMERS_DELETE);

  const removeCustomer = useMutation(
    trpc.customers.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.customers.getMany.queryOptions(filters),
        );
        toast.success("Customer deleted successfully!");
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onDelete = () => {
    removeCustomer.mutate({ id: data.id });
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
        <DropdownMenuItem asChild>
          <Link href={`/admin/shop/customers/${data.id}`}>
            <ExternalLinkIcon />
            View
          </Link>
        </DropdownMenuItem>
        {canUpdate && (
          <DropdownMenuItem onClick={() => onOpen(data)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <ConfirmModal onConfirm={onDelete}>
              <Button
                variant="ghost"
                disabled={removeCustomer.isPending}
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
