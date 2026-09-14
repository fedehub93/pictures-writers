"use client";

import "client-only";

import { DataPagination } from "@/shared/components/data-pagination";
import { ErrorState } from "@/shared/components/error-state";
import { LoadingState } from "@/shared/components/loading-state";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { usePermission } from "@/shared/providers/authorization-provider";

import { useRolesFilters } from "../../../hooks/use-roles-filters";
import { useSuspenseRoles } from "../../../hooks/use-roles";
import { toRolesInput } from "../../../filters";

import { RolesListHeader } from "../components/roles-list-header";
import { RolesTable } from "../components/roles-table";

export function RolesView() {
  const [filters, setFilters] = useRolesFilters();
  const canManage = usePermission(PERMISSIONS.ROLES_MANAGE);

  const { data } = useSuspenseRoles(toRolesInput(filters));

  const { roles, total, page, pageSize } = data;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex h-full w-full flex-col gap-4 px-6 py-3">
      <RolesTable roles={roles} canManage={canManage} />

      <DataPagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setFilters({ page: p })}
      />
    </div>
  );
}

export const RolesViewLoading = () => {
  return (
    <LoadingState
      title="Loading Roles"
      description="This may take a few seconds"
    />
  );
};

export const RolesViewError = () => {
  return <ErrorState title="Error Roles" description="Something went wrong" />;
};
