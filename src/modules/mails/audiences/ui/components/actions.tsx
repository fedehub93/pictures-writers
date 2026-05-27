"use client";

import Link from "next/link";
import {
  CloudSyncIcon,
  DownloadIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/trpc/client";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { useBatchProcessor } from "@/shared/hooks/use-batch-processor";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";
import { ProgressDialog } from "@/app/(admin)/_components/modals/progress-dialog";
import { useOpenAudience } from "../../hooks/use-open-audience";
import { AudiencesGetMany } from "../../types";

interface AudiencesAction {
  id: string;
  data: AudiencesGetMany[number];
  isAllContactsAudience: boolean;
}

export const AudiencesAction = ({
  id,
  data,
  isAllContactsAudience,
}: AudiencesAction) => {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { onOpen } = useOpenAudience();

  const { startBatch, isProcessing, percentage, progress, error } =
    useBatchProcessor({
      chunkSize: 10,
      delayMs: 1200,
    });

  const onEdit = () => {
    onOpen(data);
  };

  const removeAudience = useMutation(
    trpc.audiences.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.audiences.getMany.queryOptions());
        toast.success("Audience deleted successfully!");
        router.refresh();
      },
    }),
  );

  const onDelete = async () => {
    removeAudience.mutate({ id });
  };

  const onExportToCSV = async () => {
    // ... (tuo codice originale immutato) ...
    const response = await fetch("/api/admin/mails/contacts/export-to-csv");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const onSyncWithProvider = async () => {
    if (isProcessing) return;
    // Rimosso il try/catch/finally esterno per lasciare il controllo all'hook
    startBatch({
      getTotalItems: async () => {
        const data = await trpcClient.audiences.getContactCount.query({
          audienceId: id,
        });
        return data.totalContacts;
      },
      processChunk: async (skip, take) => {
        await trpcClient.audiences.syncContacts.mutate({
          audienceId: id,
          skip,
          take,
        });
      },
      onSuccess: () => {
        toast.success("Synchronization completed 100%!");
        router.refresh();
      },
      onError: (err) => {
        console.log(err);
        toast.error(`${err}`);
      },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-4 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isAllContactsAudience && (
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon className="size-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}
          <Link href={`/admin/mails/audiences/${id}/contacts`}>
            <DropdownMenuItem>
              <EyeIcon className="size-4 mr-2" />
              View contacts
            </DropdownMenuItem>
          </Link>
          {isAllContactsAudience && (
            <DropdownMenuItem onClick={onExportToCSV}>
              <DownloadIcon className="size-4 mr-2" />
              Export to CSV
            </DropdownMenuItem>
          )}
          {!isAllContactsAudience && (
            <>
              <DropdownMenuItem
                onClick={onSyncWithProvider}
                disabled={isProcessing} // Previene doppi click
              >
                <CloudSyncIcon className="size-4 mr-2" />
                Sync with Provider
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <ConfirmModal onConfirm={onDelete}>
                <Button
                  variant="ghost"
                  className="bg-destructive px-2! w-full justify-start text-destructive-foreground gap-0"
                >
                  <Trash2Icon className="size-4 mr-2" />
                  Delete
                </Button>
              </ConfirmModal>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* MODALE DI PROGRESSO */}
      <ProgressDialog
        title="Sync in progress"
        description="We are syncing your contacts with the provider. Please do not close this window."
        isProcessing={isProcessing}
        percentage={percentage}
        progress={progress}
        error={error}
      />
    </>
  );
};
