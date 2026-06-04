"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

import { useTRPCClient } from "@/trpc/client";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { Button } from "@/shared/ui/button";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { ProgressDialog } from "@/app/(admin)/_components/modals/progress-dialog";
import { useBatchProcessor } from "@/shared/hooks/use-batch-processor";
import { DataTableToolbar } from "./data-table-toolbar";

interface DataTableProps<TData, TValue> {
  audienceId: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  audienceId,
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  "use no memo";
  const trpcClient = useTRPCClient();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const { onOpen } = useModal();

  const router = useRouter();
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
      processChunk: async (skip, take) => {
        await trpcClient.audiences.importContacts.mutate({
          id: audienceId,
          interactions: values.interactions.map(
            (interaction) => interaction.id,
          ),
          skip,
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
    onOpen("importAudienceContacts", onSyncWithProvider, {
      interactions: [
        "user_subscribed",
        "first_feedback_request",
        "ebook_downloaded",
        "contact_requested",
      ],
    });
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  const nameFilterValue =
    (table.getColumn("email")?.getFilterValue() as string) ?? "";

  return (
    <>
      <div>
        <DataTableToolbar
          table={table}
          data={data}
          audienceId={audienceId}
          nameFilterValue={nameFilterValue}
        />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="max-w-40">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
        {/* MODALE DI PROGRESSO */}
        <ProgressDialog
          title="Sync in progress"
          description="We are syncing your contacts with the provider. Please do not close this window."
          isProcessing={isProcessing}
          percentage={percentage}
          progress={progress}
          error={error}
        />
      </div>
    </>
  );
}
