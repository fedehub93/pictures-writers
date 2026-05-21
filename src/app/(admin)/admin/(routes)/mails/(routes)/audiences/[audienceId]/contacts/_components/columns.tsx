"use client";

import { EmailContact, EmailContactInteraction } from "@/generated/prisma";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDownIcon,
  CircleAlertIcon,
  CircleCheckIcon,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

import { formatDate } from "@/lib/format";

import { EmailAudienceContactsAction } from "./actions";

type EmailContactWithInteractions = EmailContact & {
  interactions: EmailContactInteraction[];
};

export const columns: ColumnDef<EmailContactWithInteractions>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const { email, emailVerified } = row.original;
      const isVerified = !!emailVerified;
      return (
        <div className="flex gap-x-2 items-center">
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
            <CircleAlertIcon className="size-4 text-muted-foreground" />
          )}
          {email}
        </div>
      );
    },
  },
  {
    accessorKey: "firstName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          First Name
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "lastName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Name
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },

  {
    accessorKey: "Interaction Type",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Interaction
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const { interactions } = row.original;
      if (!interactions) return null;
      return <div>{interactions.map((i) => i.interactionType).join()}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created at
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
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
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { id } = row.original;

      return <EmailAudienceContactsAction id={id} />;
    },
  },
];
