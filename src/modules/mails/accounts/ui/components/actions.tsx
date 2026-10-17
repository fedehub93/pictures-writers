"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MoreHorizontalIcon,
  PencilIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";

import { useTRPC } from "@/trpc/client";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { useOpenEmailAccount } from "../../hooks/use-open-account";
import { EmailAccountGetManyRow } from "../../types";

interface EmailAccountsActionProps {
  account: EmailAccountGetManyRow;
}

export const EmailAccountsAction = ({ account }: EmailAccountsActionProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { onOpen } = useOpenEmailAccount();

  const invalidate = () =>
    queryClient.invalidateQueries(trpc.emailAccounts.getMany.queryOptions());

  const setDefault = useMutation(
    trpc.emailAccounts.setDefault.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Default account updated");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const removeAccount = useMutation(
    trpc.emailAccounts.remove.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Email account deleted successfully!");
        router.refresh();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <span className="sr-only">Open menu</span>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onOpen(account)}>
          <PencilIcon />
          Edit
        </DropdownMenuItem>
        {!account.isDefault && (
          <DropdownMenuItem
            onClick={() => setDefault.mutate({ id: account.id })}
            disabled={setDefault.isPending}
          >
            <StarIcon />
            Set as default
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <ConfirmModal onConfirm={() => removeAccount.mutate({ id: account.id })}>
          <Button
            variant="ghost"
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
