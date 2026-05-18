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

// Importiamo i componenti per la modale di caricamento
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";
import { useBatchProcessor } from "@/hooks/use-batch-processor";

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
      await axios.delete(`/api/mails/audiences/${id}`);
      toast.success("Item deleted!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const onExportToCSV = async () => {
    // ... (tuo codice originale immutato) ...
    const response = await fetch("/api/mails/contacts/export-to-csv");
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
        if (!res.ok) throw new Error(json.error || "Errore sconosciuto");
      },
      onSuccess: () => {
        toast.success("Sincronizzazione completata al 100%!");
        router.refresh(); // Il refresh va fatto SOLO quando ha finito davvero
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
      <Dialog open={isProcessing}>
        <DialogContent
          className="sm:max-w-md [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Sync in progress</DialogTitle>
            <DialogDescription>
              We are syncing your contacts with the provider. Please do not
              close this window.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Progress value={percentage} className="h-3 w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{percentage}% completed</span>
              <span>
                {progress.current} / {progress.total} contacts
              </span>
            </div>
            {error && (
              <div className="text-sm text-destructive mt-2">
                Error: {error}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
