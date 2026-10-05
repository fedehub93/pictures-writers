"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { Badge } from "@/shared/ui/badge";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import type { AutomationsGetRuns } from "../../../types";
import { formatDuration, formatRunDate } from "../../../lib/run-ledger";
import { type DataTableFeatures } from "./data-table-features";
import { RunActions } from "./run-actions";
import { RunStatusBadge } from "./run-status-badge";

type Run = AutomationsGetRuns["items"][number];

const columnHelper = createColumnHelper<DataTableFeatures, Run>();

export const getRunColumns = (automationId: string) =>
  columnHelper.columns([
    columnHelper.accessor("status", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      sortFn: "text",
      cell: ({ row }) => <RunStatusBadge status={row.original.status} />,
    }),
    columnHelper.accessor("triggerType", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Trigger" />
      ),
      sortFn: "text",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.triggerType}</Badge>
      ),
    }),
    columnHelper.accessor("startedAt", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Started" />
      ),
      sortFn: "datetime",
      cell: ({ row }) => <div>{formatRunDate(row.original.startedAt)}</div>,
    }),
    columnHelper.accessor("endedAt", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ended" />
      ),
      sortFn: "datetime",
      cell: ({ row }) => <div>{formatRunDate(row.original.endedAt)}</div>,
    }),
    columnHelper.display({
      id: "duration",
      header: () => <div>Duration</div>,
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {formatDuration(row.original.startedAt, row.original.endedAt)}
        </div>
      ),
    }),
    columnHelper.display({
      id: "error",
      header: () => <div>Error</div>,
      cell: ({ row }) =>
        row.original.error ? (
          <span className="line-clamp-1 max-w-64 text-destructive">
            {row.original.error}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <RunActions automationId={automationId} run={row.original} />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    }),
  ]);
