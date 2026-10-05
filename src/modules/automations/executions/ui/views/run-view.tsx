"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, BanIcon, XCircleIcon } from "lucide-react";

import { AutomationRunStatus } from "@/generated/prisma";

import { usePermission } from "@/shared/providers/authorization-provider";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { formatDuration, formatRunDate } from "../../../lib/run-ledger";
import { useSuspenseAutomationRun } from "../../hooks/use-executions";

import { CancelRunDialog } from "../components/cancel-run-dialog";
import { DetailField } from "../components/detail-field";
import { RunStatusBadge } from "../components/run-status-badge";
import { SnapshotViewer } from "../components/snapshot-viewer";
import { StepTrace } from "../components/step-trace";

export const RunView = ({
  automationId,
  runId,
}: {
  automationId: string;
  runId: string;
}) => {
  const { data: run } = useSuspenseAutomationRun(automationId, runId);
  const canWrite = usePermission(PERMISSIONS.AUTOMATIONS_WRITE);
  const [cancelOpen, setCancelOpen] = useState(false);

  const canCancel =
    canWrite && run.status === AutomationRunStatus.RUNNING;

  return (
    <div className="flex flex-col gap-6 px-6 py-4">
      <div className="flex items-center gap-x-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link
            href={`/admin/automations/${run.automation.id}/executions/`}
            aria-label="Back to executions"
          >
            <ArrowLeftIcon />
          </Link>
        </Button>
        <div className="flex flex-1 flex-col">
          <h1 className="text-2xl">Run</h1>
          <p className="text-sm text-muted-foreground">
            {run.automation.name} · started {formatRunDate(run.startedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelOpen(true)}
            >
              Cancel run
            </Button>
          )}
          <RunStatusBadge status={run.status} />
        </div>
      </div>

      {run.status === AutomationRunStatus.FAILED && run.error && (
        <Alert variant="destructive">
          <XCircleIcon />
          <AlertTitle>Run failed</AlertTitle>
          <AlertDescription>{run.error}</AlertDescription>
        </Alert>
      )}

      {run.status === AutomationRunStatus.CANCELED && (
        <Alert>
          <BanIcon />
          <AlertTitle>Run canceled</AlertTitle>
          {run.cancelReason && (
            <AlertDescription>{run.cancelReason}</AlertDescription>
          )}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <DetailField label="Trigger" value={run.triggerType} />
            <DetailField label="Started" value={formatRunDate(run.startedAt)} />
            <DetailField label="Ended" value={formatRunDate(run.endedAt)} />
            <DetailField
              label="Duration"
              value={formatDuration(run.startedAt, run.endedAt)}
            />
          </dl>
          <SnapshotViewer label="Trigger snapshot" value={run.payload} />
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-medium">Step trace</h2>
          <span className="text-sm text-muted-foreground">
            {run.steps.length} Step(s)
          </span>
        </div>
        <StepTrace steps={run.steps} />
      </section>

      <CancelRunDialog
        automationId={automationId}
        runId={runId}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />
    </div>
  );
};

export const RunViewLoading = () => {
  return (
    <LoadingState
      title="Loading Run"
      description="This may take a few seconds"
    />
  );
};

export const RunViewError = () => {
  return <ErrorState title="Error Run" description="Something went wrong" />;
};
