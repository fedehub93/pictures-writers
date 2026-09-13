"use client";

import "client-only";

import { useQuery } from "@tanstack/react-query";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { useTRPC } from "@/trpc/client";
import { RoleDialog } from "../components/role-dialog";
import { RolesTable } from "../components/roles-table";

export function RolesView() {
  const trpc = useTRPC();
  const rolesQuery = useQuery(trpc.roles.getMany.queryOptions());
  const roles = rolesQuery.data ?? [];

  return (
    <div className="flex h-full w-full flex-col gap-4 px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <ContentHeader label="Roles" totalEntries={roles.length} />
        <RoleDialog />
      </div>
      <RolesTable roles={roles} />
    </div>
  );
}
