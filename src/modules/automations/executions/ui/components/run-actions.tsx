"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontalIcon } from "lucide-react";

import { AutomationRunStatus } from "@/generated/prisma";

import { usePermission } from "@/shared/providers/authorization-provider";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import type { AutomationsGetRuns } from "../../../types";

import { CancelRunDialog } from "./cancel-run-dialog";

type Run = AutomationsGetRuns["items"][number];

interface RunActionsProps {
  automationId: string;
  run: Run;
}

export const RunActions = ({ automationId, run }: RunActionsProps) => {
  const canWrite = usePermission(PERMISSIONS.AUTOMATIONS_WRITE);
  const [cancelOpen, setCancelOpen] = useState(false);

  const isFailed = run.status === AutomationRunStatus.FAILED;
  const canCancel = canWrite && run.status === AutomationRunStatus.RUNNING;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <span className="sr-only">Open menu</span>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              href={`/admin/automations/${automationId}/executions/${run.id}/`}
            >
              {isFailed ? "Debug" : "View"}
            </Link>
          </DropdownMenuItem>
          {canCancel && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setCancelOpen(true)}
            >
              Cancel run
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {canCancel && (
        <CancelRunDialog
          automationId={automationId}
          runId={run.id}
          open={cancelOpen}
          onOpenChange={setCancelOpen}
        />
      )}
    </>
  );
};
