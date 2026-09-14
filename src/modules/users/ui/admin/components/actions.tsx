"use client";

import { useState } from "react";

import {
  MailIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { usePermission } from "@/shared/providers/authorization-provider";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { useUsersFilters } from "../../../hooks/use-users-filters";
import { toUsersInput } from "../../../filters";

import { EditUserDialog } from "./edit-user-dialog";

type User = inferRouterOutputs<AppRouter>["users"]["getMany"]["users"][number];

interface UsersActionsProps {
  user: User;
  roles: { id: string; name: string }[];
}

export const UsersActions = ({ user, roles }: UsersActionsProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = useUsersFilters();
  const canUpdate = usePermission(PERMISSIONS.USERS_UPDATE);
  const canManage = usePermission(PERMISSIONS.USERS_MANAGE);

  const [editOpen, setEditOpen] = useState(false);

  const activities = useQuery(
    trpc.users.getActivityHistory.queryOptions(
      { userId: user.id },
      { enabled: editOpen },
    ),
  );

  const update = useMutation(
    trpc.users.update.mutationOptions({
      onSuccess: () => {
        toast.success("User updated");
        setEditOpen(false);
        queryClient.invalidateQueries(
          trpc.users.getMany.queryFilter(toUsersInput(filters)),
        );
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const status = useMutation(
    trpc.users.updateStatus.mutationOptions({
      onSuccess: () => {
        toast.success("Account status updated");
        queryClient.invalidateQueries(
          trpc.users.getMany.queryFilter(toUsersInput(filters)),
        );
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const requestReset = useMutation(
    trpc.users.requestPasswordReset.mutationOptions({
      onSuccess: () => toast.success("Password reset email sent"),
      onError: (error) => toast.error(error.message),
    }),
  );

  const onToggleStatus = () => {
    status.mutate({
      id: user.id,
      accountStatus: user.accountStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
    });
  };

  if (!canUpdate && !canManage) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <span className="sr-only">Open menu</span>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canUpdate && (
            <DropdownMenuItem
              onSelect={() => {
                setEditOpen(true);
              }}
            >
              <PencilIcon data-icon="inline-start" />
              Edit
            </DropdownMenuItem>
          )}
          {canManage && (
            <DropdownMenuItem
              onSelect={() => requestReset.mutate({ email: user.email ?? "" })}
              disabled={requestReset.isPending}
            >
              <MailIcon data-icon="inline-start" />
              Reset password
            </DropdownMenuItem>
          )}
          {canUpdate && (
            <>
              <DropdownMenuSeparator />
              {user.accountStatus === "ACTIVE" ? (
                <ConfirmModal onConfirm={onToggleStatus}>
                  <Button
                    variant="ghost"
                    disabled={status.isPending}
                    className="bg-destructive w-full justify-start px-2! text-destructive-foreground"
                  >
                    <ShieldOffIcon data-icon="inline-start" />
                    Suspend
                  </Button>
                </ConfirmModal>
              ) : (
                <DropdownMenuItem
                  onSelect={onToggleStatus}
                  disabled={status.isPending}
                >
                  <ShieldCheckIcon data-icon="inline-start" />
                  Reactivate
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <EditUserDialog
        open={editOpen}
        user={user}
        roles={roles}
        activities={activities.data ?? []}
        pending={update.isPending}
        onClose={() => setEditOpen(false)}
        onSubmit={(value) => update.mutate(value)}
      />
    </>
  );
};
