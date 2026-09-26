"use client";

import { XCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

import type { AutomationsGetRun } from "../../../types";
import { formatRunDate } from "../../../lib/run-ledger";

import { DetailField } from "./detail-field";
import { SnapshotViewer } from "./snapshot-viewer";
import { StepStatusBadge } from "./run-status-badge";

type Step = AutomationsGetRun["steps"][number];

const StepCard = ({ step }: { step: Step }) => {
  const title = step.nodeName || step.nodeType || step.nodeId;
  const showType =
    Boolean(step.nodeType) && step.nodeName !== step.nodeType && step.nodeName;

  return (
    <Card>
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">#{step.seq}</Badge>
            <CardTitle className="text-base">{title}</CardTitle>
            {showType && <Badge variant="secondary">{step.nodeType}</Badge>}
          </div>
          <StepStatusBadge status={step.status} />
        </div>
        <CardDescription>
          Node {step.nodeId} · {step.attempts} attempt(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <DetailField label="Started" value={formatRunDate(step.startedAt)} />
          <DetailField label="Ended" value={formatRunDate(step.endedAt)} />
          <DetailField label="Resumes at" value={formatRunDate(step.resumeAt)} />
          <DetailField label="Attempts" value={String(step.attempts)} />
        </dl>

        {step.error && (
          <Alert variant="destructive">
            <XCircleIcon />
            <AlertTitle>Step error</AlertTitle>
            <AlertDescription>{step.error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <SnapshotViewer label="Input snapshot" value={step.input} />
          <SnapshotViewer label="Output snapshot" value={step.output} />
        </div>
      </CardContent>
    </Card>
  );
};

export const StepTrace = ({ steps }: { steps: Step[] }) => {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This Run produced no Steps.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {steps.map((step) => (
        <StepCard key={step.id} step={step} />
      ))}
    </div>
  );
};
