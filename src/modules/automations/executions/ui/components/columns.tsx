"use client";

import Link from "next/link";
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

const runStatusColumn = () =>
  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    sortFn: "text",
    cell: ({ row }) => <RunStatusBadge status={row.original.status} />,
  });

const triggerColumn = () =>
  columnHelper.accessor("triggerType", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trigger" />
    ),
    sortFn: "text",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.triggerType}</Badge>
    ),
  });

const startedAtColumn = () =>
  columnHelper.accessor("startedAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Started" />
    ),
    sortFn: "datetime",
    cell: ({ row }) => <div>{formatRunDate(row.original.startedAt)}</div>,
  });

const endedAtColumn = () =>
  columnHelper.accessor("endedAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ended" />
    ),
    sortFn: "datetime",
    cell: ({ row }) => <div>{formatRunDate(row.original.endedAt)}</div>,
  });

const durationColumn = () =>
  columnHelper.display({
    id: "duration",
    header: () => <div>Duration</div>,
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {formatDuration(row.original.startedAt, row.original.endedAt)}
      </div>
    ),
  });

const errorColumn = () =>
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
  });

const actionsColumn = (automationIdFor: (run: Run) => string) =>
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RunActions
          automationId={automationIdFor(row.original)}
          run={row.original}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  });

/** Columns for the executions of a single Automation. */
export const getRunColumns = (automationId: string) =>
  columnHelper.columns([
    runStatusColumn(),
    triggerColumn(),
    startedAtColumn(),
    endedAtColumn(),
    durationColumn(),
    errorColumn(),
    actionsColumn(() => automationId),
  ]);

/** Columns for the global Executions view, across every Automation. */
export const getGlobalRunColumns = () =>
  columnHelper.columns([
    columnHelper.accessor((row) => row.automation.name, {
      id: "automation",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Automation" />
      ),
      sortFn: "text",
      cell: ({ row }) => (
        <Link
          href={`/admin/automations/${row.original.automationId}/`}
          className="font-medium hover:underline"
        >
          {row.original.automation.name}
        </Link>
      ),
    }),
    runStatusColumn(),
    triggerColumn(),
    startedAtColumn(),
    endedAtColumn(),
    durationColumn(),
    errorColumn(),
    actionsColumn((run) => run.automationId),
  ]);
