"use client";
import * as React from "react";
import Link from "next/link";

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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Import, PlusCircle } from "lucide-react";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { useProgressLoader } from "@/app/(admin)/_hooks/use-progress-loader-store";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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
    []
  );
  const { onOpen } = useModal();
  const { onOpen: onOpenProgress, onClose: onCloseProgress } =
    useProgressLoader();
  const router = useRouter();

  const importContacts = async (values: {
    interactions: { label: string; value: string }[];
  }) => {
    try {
      onOpenProgress({ label: "Importing contacts..." });
      const response = await axios.patch(
        `/api/mails/audiences/${audienceId}/import`,
        {
          interactions: values.interactions.map(
            (interaction) => interaction.value
          ),
        }
      );
      toast.success("Contacts imported successfully!");
      router.refresh();
    } catch (error) {
      toast.error("Failed to import contacts!");
    } finally {
      onCloseProgress();
    }
  };

  const onHandleImport = () => {
    onOpen("importAudienceContacts", importContacts, {
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
    <div>
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
                            header.getContext()
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
                        cell.getContext()
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
    </div>
  );
}
