"use client";

import "client-only";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { RoleDialog } from "./role-dialog";

type Role = inferRouterOutputs<AppRouter>["roles"]["getMany"]["roles"][number];

interface RolesActionsProps {
  role: Role;
  canManage: boolean;
}

export const RolesActions = ({ role, canManage }: RolesActionsProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const remove = useMutation(
    trpc.roles.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Role removed");
        setDeletingId(null);
        void queryClient.invalidateQueries({
          queryKey: trpc.roles.getMany.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message);
        setDeletingId(null);
      },
    }),
  );

  if (!canManage) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <span className="sr-only">Open role actions</span>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <PencilIcon data-icon="inline-start" />
              Edit role
            </DropdownMenuItem>
            {!role.isSystem && (
              <>
                <DropdownMenuSeparator />
                <ConfirmModal
                  onConfirm={() => {
                    setDeletingId(role.id);
                    remove.mutate({ id: role.id });
                  }}
                >
                  <Button
                    variant="ghost"
                    disabled={role._count.users > 0 || remove.isPending}
                    className="bg-destructive w-full justify-start px-2! text-destructive-foreground"
                  >
                    <Trash2Icon data-icon="inline-start" />
                    {deletingId === role.id ? "Removing..." : "Remove role"}
                  </Button>
                </ConfirmModal>
              </>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <RoleDialog open={editOpen} onOpenChange={setEditOpen} role={role} />
    </>
  );
};
