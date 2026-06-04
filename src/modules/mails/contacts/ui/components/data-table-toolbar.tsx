"use client";

import { useState } from "react";
import { ArrowDownIcon, PlusCircleIcon, XIcon } from "lucide-react";
import { Table } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTRPCClient } from "@/trpc/client";

import { Button } from "@/shared/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";

import { useBatchProcessor } from "@/shared/hooks/use-batch-processor";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { ProgressDialog } from "@/app/(admin)/_components/modals/progress-dialog";

import { useOpenContact } from "../../hooks/use-open-contact";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  data: TData[];
  audienceId: string;
  nameFilterValue: string;
}

export function DataTableToolbar<TData>({
  table,
  audienceId,
  nameFilterValue,
}: DataTableToolbarProps<TData>) {
  const trpcClient = useTRPCClient();
  const [isLoading, _] = useState(false);
  const router = useRouter();
  const { onOpen } = useOpenContact();
  const { onOpen: onOpenImport } = useModal();

  const { startBatch, isProcessing, percentage, progress, error } =
    useBatchProcessor({ chunkSize: 10, delayMs: 1200 });

  const onSyncWithProvider = async (values: {
    interactions: { id: string }[];
  }) => {
    if (isProcessing) return;
    startBatch({
      getTotalItems: async () => {
        const data = await trpcClient.audiences.getFilteredContactCount.query({
          id: audienceId,
          interactions: values.interactions.map(
            (interaction) => interaction.id,
          ),
        });
        return data.totalContacts;
      },
      processChunk: async (_skip, take) => {
        await trpcClient.audiences.importContacts.mutate({
          id: audienceId,
          interactions: values.interactions.map(
            (interaction) => interaction.id,
          ),
          skip: 0,
          take,
        });
      },
      onSuccess: () => {
        toast.success("Import completed 100%!");
        router.refresh();
      },
      onError: (err) => {
        toast.error(`Interrupted process: ${err}`);
      },
    });
  };

  const onHandleImport = () => {
    onOpenImport("importAudienceContacts", onSyncWithProvider, {
      interactions: [
        "user_subscribed",
        "first_feedback_request",
        "ebook_downloaded",
        "contact_requested",
      ],
    });
  };

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <>
      <div className="flex items-center justify-between py-4">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Filter contacts..."
            value={nameFilterValue}
            onChange={(event) =>
              table.getColumn("email")?.setFilterValue(event.target.value)
            }
            className="h-8 w-37.5 lg:w-62.5"
          />
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <XIcon className="ml-2 size-4" />
            </Button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isLoading}>
            <Button type="button" variant="outline" size="sm">
              Actions
              <ArrowDownIcon className="size-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onOpen()}>
              <PlusCircleIcon className="size-4 mr-2" />
              New contact
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onHandleImport}>
              <ArrowDownIcon className="size-4 mr-2" />
              Import
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
}
