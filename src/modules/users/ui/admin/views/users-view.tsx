"use client";

import { type SetStateAction } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type SortingState } from "@tanstack/react-table";
import { RotateCw, X } from "lucide-react";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataPagination } from "@/shared/components/data-pagination";
import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { useUsersFilters } from "../../../hooks/use-users-filters";
import { useSuspenseUsers } from "../../../hooks/use-users";
import { toUsersInput, type UsersFilters } from "../../../filters";
import { DEFAULT_PAGE } from "../../../constants";

import { DataTable } from "../components/data-table";
import { createColumns } from "../components/columns";

export const UsersView = () => {
  const [filters, setFilters] = useUsersFilters();
  const trpc = useTRPC();

  const { data } = useSuspenseUsers(toUsersInput(filters));

  const { users, total, page, pageSize, roles } = data;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const sorting: SortingState = [
    { id: filters.sort, desc: filters.direction === "desc" },
  ];

  const onSortingChange = (updater: SetStateAction<SortingState>) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const sort = next[0];
    setFilters({
      sort: sort ? (sort.id as UsersFilters["sort"]) : "createdAt",
      direction: sort ? (sort.desc ? "desc" : "asc") : "desc",
      page: DEFAULT_PAGE,
    });
  };

  const invitations = useQuery(trpc.users.getInvitations.queryOptions());

  const resendInvitation = useMutation(
    trpc.users.resendInvitation.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation resent");
        void invitations.refetch();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const cancelInvitation = useMutation(
    trpc.users.cancelInvitation.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation cancelled");
        void invitations.refetch();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const columns = createColumns({ roles });

  return (
    <div className="flex h-full w-full flex-col gap-4 px-6 py-3">
      <DataTable
        columns={columns}
        data={users}
        sorting={sorting}
        onSortingChange={onSortingChange}
      />

      <DataPagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setFilters({ page: p })}
      />

      {invitations.data && invitations.data.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Invitations</h2>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.data.map((invitation) => (
                  <tr className="border-b last:border-0" key={invitation.id}>
                    <td className="p-3">{invitation.email}</td>
                    <td className="p-3">{invitation.role.name}</td>
                    <td className="p-3">
                      <Badge
                        variant={
                          invitation.status === "PENDING"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {invitation.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {invitation.status === "PENDING" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              resendInvitation.mutate({ id: invitation.id })
                            }
                          >
                            <RotateCw data-icon="inline-start" />
                            Resend
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              cancelInvitation.mutate({ id: invitation.id })
                            }
                          >
                            <X data-icon="inline-start" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export const UsersViewLoading = () => {
  return (
    <LoadingState
      title="Loading Users"
      description="This may take a few seconds"
    />
  );
};

export const UsersViewError = () => {
  return <ErrorState title="Error Users" description="Something went wrong" />;
};
