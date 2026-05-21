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
import axios from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";
import { useBatchProcessor } from "@/hooks/use-batch-processor";
import { ProgressDialog } from "@/app/(admin)/_components/modals/progress-dialog";

interface AudiencesAction {
  id: string;
  isAllContactsAudience: boolean;
}

export const AudiencesAction = ({
  id,
  isAllContactsAudience,
}: AudiencesAction) => {
  const router = useRouter();

  const { startBatch, isProcessing, percentage, progress, error } =
    useBatchProcessor({
      chunkSize: 10,
      delayMs: 1200,
    });

  const onDelete = async () => {
    try {
      await axios.delete(`/api/admin/mails/audiences/${id}`);
      toast.success("Item deleted!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
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
        const res = await fetch(`/api/admin/mails/audiences/${id}/sync/count`);
        const data = await res.json();
        return data.totalContacts;
      },
      processChunk: async (skip, take) => {
        const res = await fetch(`/api/admin/mails/audiences/${id}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skip, take }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Unknown error");
      },
      onSuccess: () => {
        toast.success("Synchronization completed 100%!");
        router.refresh();
      },
      onError: (err) => {
        toast.error(`Processo interrotto: ${err}`);
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
            <Link href={`/admin/mails/audiences/${id}`}>
              <DropdownMenuItem>
                <PencilIcon className="size-4 mr-2" />
                Edit
              </DropdownMenuItem>
            </Link>
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
