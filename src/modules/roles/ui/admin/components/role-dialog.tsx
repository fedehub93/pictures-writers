"use client";

import "client-only";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { DialogFooter } from "@/shared/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { ResponsiveDialog } from "@/shared/components/responsive-dialog";

import { ADMIN_ROLE_KEY } from "../../../constants";

type Role = inferRouterOutputs<AppRouter>["roles"]["getMany"]["roles"][number];
type Permission = inferRouterOutputs<AppRouter>["roles"]["getCatalog"][number];

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role;
}

export function RoleDialog({ open, onOpenChange, role }: RoleDialogProps) {
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [lastOpenedFor, setLastOpenedFor] = useState<{
    open: boolean;
    roleId?: string;
  }>({ open, roleId: role?.id });
  const trpc = useTRPC();

  if (open !== lastOpenedFor.open || role?.id !== lastOpenedFor.roleId) {
    setLastOpenedFor({ open, roleId: role?.id });
    if (open) {
      setName(role?.name ?? "");
      setIsActive(role?.isActive ?? true);
      setPermissionIds(
        role?.permissions.map(({ permission }) => permission.id) ?? [],
      );
    }
  }

  const queryClient = useQueryClient();
  const catalogQuery = useQuery(trpc.roles.getCatalog.queryOptions());
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trpc.roles.getMany.queryKey() });
  const createMutation = useMutation(
    trpc.roles.create.mutationOptions({
      onSuccess: () => {
        toast.success("Role created");
        onOpenChange(false);
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
  const updateMutation = useMutation(
    trpc.roles.update.mutationOptions({
      onSuccess: () => {
        toast.success("Role updated");
        onOpenChange(false);
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
  const pending = createMutation.isPending || updateMutation.isPending;

  const isAdmin = role?.key === ADMIN_ROLE_KEY;
  const catalogIds = (catalogQuery.data ?? []).map(
    (permission) => permission.id,
  );

  const togglePermission = (permissionId: string, checked: boolean) => {
    setPermissionIds((current) =>
      checked
        ? [...current, permissionId]
        : current.filter((id) => id !== permissionId),
    );
  };

  const submit = () => {
    if (!name.trim()) return;
    if (role) {
      updateMutation.mutate({
        id: role.id,
        name,
        isActive: isAdmin ? true : isActive,
        permissionIds: isAdmin ? catalogIds : permissionIds,
      });
    } else {
      createMutation.mutate({ name, permissionIds });
    }
  };

  const permissionsByArea = (catalogQuery.data ?? []).reduce<
    Record<string, Permission[]>
  >((groups, permission) => {
    (groups[permission.area] ??= []).push(permission);
    return groups;
  }, {});

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={role ? "Edit role" : "Create role"}
      description="Choose a unique name and grant permissions from the system catalog."
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="role-name">Name</FieldLabel>
          <Input
            id="role-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
          />
        </Field>
        {role && (
          <Field orientation="horizontal">
            <div className="flex-1">
              <FieldLabel htmlFor="role-active">Active</FieldLabel>
              <FieldDescription>
                Inactive roles cannot access the back office.
              </FieldDescription>
            </div>
            <Switch
              id="role-active"
              checked={isAdmin ? true : isActive}
              onCheckedChange={setIsActive}
              disabled={isAdmin}
            />
          </Field>
        )}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-medium">Permissions</h3>
            <p className="text-sm text-muted-foreground">
              Only permissions defined by the system can be assigned.
            </p>
          </div>
          {Object.entries(permissionsByArea).map(([area, permissions]) => (
            <FieldSet key={area} className="rounded-md border p-4">
              <FieldLegend className="px-1 capitalize">{area}</FieldLegend>
              <div className="grid gap-3 sm:grid-cols-2">
                {permissions.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={isAdmin ? true : permissionIds.includes(permission.id)}
                      onCheckedChange={(checked) =>
                        togglePermission(permission.id, checked === true)
                      }
                      disabled={isAdmin}
                    />
                    <span>{permission.action}</span>
                  </label>
                ))}
              </div>
            </FieldSet>
          ))}
        </div>
      </FieldGroup>
      <DialogFooter className="mt-6 flex flex-row justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={pending || !name.trim()}>
          {pending ? "Saving..." : "Save role"}
        </Button>
      </DialogFooter>
    </ResponsiveDialog>
  );
}