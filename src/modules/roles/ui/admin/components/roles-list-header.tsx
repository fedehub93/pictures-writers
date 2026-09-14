"use client";

import "client-only";

import { useState } from "react";
import { PlusIcon } from "lucide-react";

import { PERMISSIONS } from "@/shared/lib/permissions";
import { usePermission } from "@/shared/providers/authorization-provider";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { Button } from "@/shared/ui/button";

import { useRolesFilters } from "../../../hooks/use-roles-filters";
import { useRolesQuery } from "../../../hooks/use-roles";
import { toRolesInput } from "../../../filters";

import { RoleDialog } from "./role-dialog";

export const RolesListHeader = () => {
  const [filters] = useRolesFilters();
  const canManage = usePermission(PERMISSIONS.ROLES_MANAGE);
  const [createOpen, setCreateOpen] = useState(false);

  const { data } = useRolesQuery(toRolesInput(filters));

  return (
    <div className="flex flex-col gap-y-4 px-6 py-4">
      <div className="flex items-center justify-between">
        <ContentHeader label="Roles" totalEntries={data?.total ?? 0} />
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            New role
          </Button>
        )}
      </div>
      <RoleDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};
