"use client";

import { useState } from "react";
import { UserPlus, XCircleIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { Button } from "@/shared/ui/button";
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area";

import { PERMISSIONS } from "@/shared/lib/permissions";
import { usePermission } from "@/shared/providers/authorization-provider";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { useUsersFilters } from "../../../hooks/use-users-filters";
import { useUsersQuery } from "../../../hooks/use-users";
import { toUsersInput } from "../../../filters";
import { DEFAULT_PAGE } from "../../../constants";

import { InviteUserDialog } from "./invite-user-dialog";
import { UsersSearchFilter } from "./users-search-filter";
import { UsersRoleFilter } from "./users-role-filter";
import { UsersStatusFilter } from "./users-status-filter";

export const UsersListHeader = () => {
  const [filters, setFilters] = useUsersFilters();
  const trpc = useTRPC();
  const canManage = usePermission(PERMISSIONS.USERS_MANAGE);
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data } = useUsersQuery(toUsersInput(filters));

  const roles = data?.roles ?? [];

  const createInvitation = useMutation(
    trpc.users.createInvitation.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation sent");
        setInviteOpen(false);
        void queryClient.invalidateQueries({
          queryKey: trpc.users.getMany.queryKey(),
        });
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const isAnyFilterModified =
    !!filters.search || !!filters.status || !!filters.roleId;

  const onClearFilters = () => {
    setFilters({
      search: "",
      page: DEFAULT_PAGE,
      status: null,
      roleId: "",
      sort: "createdAt",
      direction: "desc",
    });
  };

  return (
    <div className="flex flex-col gap-y-4 px-6 py-4">
      <div className="flex items-center justify-between">
        <ContentHeader label="Users" totalEntries={data?.total ?? 0} />
        {canManage && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus data-icon="inline-start" />
            Invite user
          </Button>
        )}
      </div>
      <div className="flex w-full items-center gap-2">
        <ScrollArea className="w-full">
          <div className="flex items-center gap-x-2 p-1">
            <UsersSearchFilter />
            <UsersRoleFilter roles={roles} />
            <UsersStatusFilter />
            {isAnyFilterModified && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="h-8"
              >
                <XCircleIcon data-icon="inline-start" />
                Clear
              </Button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      <InviteUserDialog
        open={inviteOpen}
        roles={roles}
        pending={createInvitation.isPending}
        onClose={() => setInviteOpen(false)}
        onSubmit={(value) => createInvitation.mutate(value)}
      />
    </div>
  );
};
