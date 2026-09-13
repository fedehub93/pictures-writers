"use client";

import "client-only";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";
import { useTRPC } from "@/trpc/client";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { RoleDialog } from "./role-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

type Role = inferRouterOutputs<AppRouter>["roles"]["getMany"][number];

export function RolesTable({ roles }: { roles: Role[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const removeMutation = useMutation(trpc.roles.remove.mutationOptions({
    onSuccess: () => { toast.success("Role removed"); setDeletingId(null); queryClient.invalidateQueries({ queryKey: trpc.roles.getMany.queryKey() }); },
    onError: (error) => { toast.error(error.message); setDeletingId(null); },
  }));

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Permissions</TableHead><TableHead>Assigned users</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell className="font-medium">{role.name}{role.isSystem && <Badge variant="outline" className="ml-2">System</Badge>}</TableCell>
              <TableCell><Badge variant={role.isActive ? "secondary" : "outline"}>{role.isActive ? "Active" : "Inactive"}</Badge></TableCell>
              <TableCell>{role.permissions.length}</TableCell>
              <TableCell>{role._count.users}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal data-icon="inline-start" /><span className="sr-only">Open role actions</span></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <RoleDialog role={role} trigger={<DropdownMenuItem onSelect={(event) => event.preventDefault()}>Edit role</DropdownMenuItem>} />
                      {!role.isSystem && <DropdownMenuItem disabled={role._count.users > 0 || removeMutation.isPending} onClick={() => { setDeletingId(role.id); removeMutation.mutate({ id: role.id }); }}><Trash2Icon data-icon="inline-start" />{deletingId === role.id ? "Removing..." : "Remove role"}</DropdownMenuItem>}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {!roles.length && <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No roles found.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}
