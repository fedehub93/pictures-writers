"use client";

import "client-only";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";

type Role = inferRouterOutputs<AppRouter>["roles"]["getMany"][number];
type Permission = inferRouterOutputs<AppRouter>["roles"]["getCatalog"][number];

export function RoleDialog({ role, trigger }: { role?: Role; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const catalogQuery = useQuery(trpc.roles.getCatalog.queryOptions());
  const invalidate = () => queryClient.invalidateQueries({ queryKey: trpc.roles.getMany.queryKey() });
  const createMutation = useMutation(trpc.roles.create.mutationOptions({ onSuccess: () => { toast.success("Role created"); setOpen(false); invalidate(); }, onError: (error) => toast.error(error.message) }));
  const updateMutation = useMutation(trpc.roles.update.mutationOptions({ onSuccess: () => { toast.success("Role updated"); setOpen(false); invalidate(); }, onError: (error) => toast.error(error.message) }));
  const pending = createMutation.isPending || updateMutation.isPending;

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setName(role?.name ?? "");
      setIsActive(role?.isActive ?? true);
      setPermissionIds(role?.permissions.map(({ permission }) => permission.id) ?? []);
    }
    setOpen(nextOpen);
  };

  const togglePermission = (permissionId: string, checked: boolean) => {
    setPermissionIds((current) => checked ? [...current, permissionId] : current.filter((id) => id !== permissionId));
  };

  const submit = () => {
    if (!name.trim()) return;
    if (role) {
      updateMutation.mutate({ id: role.id, name, isActive, permissionIds });
    } else {
      createMutation.mutate({ name, permissionIds });
    }
  };

  const permissionsByArea = (catalogQuery.data ?? []).reduce<Record<string, Permission[]>>((groups, permission) => {
    (groups[permission.area] ??= []).push(permission);
    return groups;
  }, {});

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : <DialogTrigger asChild><Button><PlusIcon data-icon="inline-start" />New role</Button></DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{role ? "Edit role" : "Create role"}</DialogTitle>
          <DialogDescription>Choose a unique name and grant permissions from the system catalog.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="role-name">Name</FieldLabel>
            <Input id="role-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
          </Field>
          {role && (
            <Field orientation="horizontal">
              <div className="flex-1">
                <FieldLabel htmlFor="role-active">Active</FieldLabel>
                <FieldDescription>Inactive roles cannot access the back office.</FieldDescription>
              </div>
              <Switch id="role-active" checked={isActive} onCheckedChange={setIsActive} disabled={role.key === "ADMIN"} />
            </Field>
          )}
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-medium">Permissions</h3>
              <p className="text-sm text-muted-foreground">Only permissions defined by the system can be assigned.</p>
            </div>
            {Object.entries(permissionsByArea).map(([area, permissions]) => (
              <FieldSet key={area} className="rounded-md border p-4">
                <FieldLegend className="px-1 capitalize">{area}</FieldLegend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {permissions.map((permission) => (
                    <label key={permission.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={permissionIds.includes(permission.id)} onCheckedChange={(checked) => togglePermission(permission.id, checked === true)} />
                      <span>{permission.action}</span>
                    </label>
                  ))}
                </div>
              </FieldSet>
            ))}
          </div>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={pending || !name.trim()}>{pending ? "Saving..." : "Save role"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
