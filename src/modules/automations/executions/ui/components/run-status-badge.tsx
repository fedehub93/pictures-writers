"use client";

import {
  BanIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleIcon,
  LoaderCircleIcon,
  type LucideIcon,
  XCircleIcon,
} from "lucide-react";

import {
  AutomationRunStatus,
  AutomationRunStepStatus,
} from "@/generated/prisma";

import { getFirstCharUppercase } from "@/shared/lib/utils";

import { Badge, type BadgeProps } from "@/shared/ui/badge";

export type RunStatusMeta = {
  variant: BadgeProps["variant"];
  Icon: LucideIcon;
  spin?: boolean;
};

export const RUN_STATUS_META: Record<AutomationRunStatus, RunStatusMeta> = {
  [AutomationRunStatus.FAILED]: { variant: "destructive", Icon: XCircleIcon },
  [AutomationRunStatus.COMPLETED]: {
    variant: "default",
    Icon: CheckCircle2Icon,
  },
  [AutomationRunStatus.RUNNING]: {
    variant: "secondary",
    Icon: LoaderCircleIcon,
    spin: true,
  },
  [AutomationRunStatus.CANCELED]: { variant: "outline", Icon: BanIcon },
};

const STEP_STATUS_META: Record<AutomationRunStepStatus, RunStatusMeta> = {
  [AutomationRunStepStatus.FAILED]: {
    variant: "destructive",
    Icon: XCircleIcon,
  },
  [AutomationRunStepStatus.COMPLETED]: {
    variant: "default",
    Icon: CheckCircle2Icon,
  },
  [AutomationRunStepStatus.RUNNING]: {
    variant: "secondary",
    Icon: LoaderCircleIcon,
    spin: true,
  },
  [AutomationRunStepStatus.PENDING]: {
    variant: "outline",
    Icon: CircleDashedIcon,
  },
  [AutomationRunStepStatus.SKIPPED]: {
    variant: "secondary",
    Icon: CircleIcon,
  },
};

function label(value: string): string {
  return getFirstCharUppercase(value.toLowerCase());
}

const StatusBadge = ({ status, meta }: { status: string; meta: RunStatusMeta }) => (
  <Badge variant={meta.variant} className="gap-1 [&_svg]:size-3">
    <meta.Icon className={meta.spin ? "animate-spin" : undefined} />
    {label(status)}
  </Badge>
);

export const RunStatusBadge = ({ status }: { status: AutomationRunStatus }) => (
  <StatusBadge status={status} meta={RUN_STATUS_META[status]} />
);

export const StepStatusBadge = ({
  status,
}: {
  status: AutomationRunStepStatus;
}) => <StatusBadge status={status} meta={STEP_STATUS_META[status]} />;
