"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Import, PlusCircle } from "lucide-react";

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
import { Input } from "@/shared/ui/input";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { ProgressDialog } from "@/app/(admin)/_components/modals/progress-dialog";
import { useBatchProcessor } from "@/shared/hooks/use-batch-processor";

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
        const res = await fetch(
          `/api/admin/mails/audiences/${audienceId}/import/count?interactions=${values.interactions
            .map((interaction) => interaction.id)
            .join(",")}`,
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch contact count");
        }

        const data = await res.json();
        return data.totalContacts;
      },
      processChunk: async () => {
        const res = await fetch(
          `/api/admin/mails/audiences/${audienceId}/import`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              interactions: values.interactions.map(
                (interaction) => interaction.id,
              ),
              skip: 0,
              take: 10,
            }),
          },
        );

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Unknown error");
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

  return (
    <>
      <div className="flex items-center py-4 justify-between">
        <Input
          placeholder="Filter contacts..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center gap-x-4">
          {audienceId.toUpperCase() !== "ALL" && (
            <Button variant="outline" onClick={onHandleImport}>
              <Import className="h-4 w-4 mr-2" />
              Import
            </Button>
          )}
          <Link href="/admin/mails/contacts/create">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Contact
            </Button>
          </Link>
        </div>
      </div>
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
    </>
  );
}
