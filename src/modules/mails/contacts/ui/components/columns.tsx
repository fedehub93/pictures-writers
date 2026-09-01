"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import { formatDate } from "@/lib/format";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import { EmailAudienceContactsAction } from "./actions";
import { ContactsGetMany } from "../../types";
import { type DataTableFeatures } from "./data-table-features";

type Contact = ContactsGetMany[number];

const columnHelper = createColumnHelper<DataTableFeatures, Contact>();

export const columns = columnHelper.columns([
  columnHelper.accessor("email", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    sortFn: "text",
    filterFn: "includesString",
    cell: ({ row }) => {
      const { email, emailVerified } = row.original;
      const isVerified = !!emailVerified;
      return (
        <div className="flex items-center gap-x-2">
          {isVerified ? (
            <Tooltip>
              <TooltipTrigger>
                <CircleCheckIcon className="size-4 min-w-4 text-primary" />
              </TooltipTrigger>
              <TooltipContent side="left">
                Verified on {formatDate({ date: emailVerified })}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger>
                <CircleAlertIcon className="size-4 min-w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="left">Not verified yet</TooltipContent>
            </Tooltip>
          )}
          {email}
        </div>
      );
    },
  }),
  columnHelper.accessor("firstName", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="First Name" />
    ),
    sortFn: "text",
  }),
  columnHelper.accessor("lastName", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Name" />
    ),
    sortFn: "text",
  }),
  columnHelper.display({
    id: "interactions",
    header: "Interaction",
    enableSorting: false,
    cell: ({ row }) => {
      const { interactions } = row.original;
      if (!interactions) return null;
      return <div>{interactions.map((i) => i.interactionType).join()}</div>;
    },
  }),
  columnHelper.accessor("createdAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created at" />
    ),
    sortFn: "datetime",
    cell: ({ row }) => {
      const { createdAt } = row.original;
      const date = new Date(createdAt);
      const formattedDate = date.toLocaleDateString("it-IT", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      return <div>{formattedDate}</div>;
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const { id } = row.original;
      return <EmailAudienceContactsAction id={id} data={row.original} />;
    },
    enableHiding: false,
  }),
]);
