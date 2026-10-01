"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, MoreHorizontalIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

interface TemplateActionProps {
  id: string;
}

export const TemplateAction = ({ id }: TemplateActionProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const duplicateTemplate = useMutation(
    trpc.templates.duplicate.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.templates.getMany.queryOptions(),
        );
        toast.success("Template duplicated successfully");
        router.push(`/admin/mails/templates/${data.id}`);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to duplicate template");
      },
    }),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <span className="sr-only">Open menu</span>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Link href={`/admin/mails/templates/${id}`}>
          <DropdownMenuItem>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem
          onClick={() => duplicateTemplate.mutate({ id })}
          disabled={duplicateTemplate.isPending}
        >
          <CopyIcon />
          Duplicate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
