"use client";

import {
  CheckCircleIcon,
  CircleDashedIcon,
  CircleIcon,
  ClockIcon,
  MailIcon,
  NotebookPenIcon,
  TimerIcon,
  XCircleIcon,
} from "lucide-react";

import { ScheduledActionStatus, ScheduledActionType } from "@/generated/prisma";

import { CommandSelect } from "@/shared/components/command-select";

interface ScheduleToolbarProps {
  selectedActionType: string;
  setSelectedActionType: (value: string | null) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string | null) => void;
}

const actionTypeOptions = [
  {
    id: "all",
    value: "all",
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CircleIcon className="size-4" />
        All actions
      </div>
    ),
  },
  {
    id: ScheduledActionType.PUBLISH_POST,
    value: ScheduledActionType.PUBLISH_POST,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <NotebookPenIcon className="size-4" />
        Post publication
      </div>
    ),
  },
  {
    id: ScheduledActionType.SEND_EMAIL,
    value: ScheduledActionType.SEND_EMAIL,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <MailIcon className="size-4" />
        Email send
      </div>
    ),
  },
];

const statusOptions = [
  {
    id: "all",
    value: "all",
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CircleIcon className="size-4" />
        All statuses
      </div>
    ),
  },
  {
    id: ScheduledActionStatus.SCHEDULED,
    value: ScheduledActionStatus.SCHEDULED,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <ClockIcon className="size-4" />
        {ScheduledActionStatus.SCHEDULED}
      </div>
    ),
  },
  {
    id: ScheduledActionStatus.PROCESSING,
    value: ScheduledActionStatus.PROCESSING,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CircleDashedIcon className="size-4" />
        {ScheduledActionStatus.PROCESSING}
      </div>
    ),
  },
  {
    id: ScheduledActionStatus.RETRY_WAIT,
    value: ScheduledActionStatus.RETRY_WAIT,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <TimerIcon className="size-4" />
        {ScheduledActionStatus.RETRY_WAIT}
      </div>
    ),
  },
  {
    id: ScheduledActionStatus.SUCCEEDED,
    value: ScheduledActionStatus.SUCCEEDED,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CheckCircleIcon className="size-4" />
        {ScheduledActionStatus.SUCCEEDED}
      </div>
    ),
  },
  {
    id: ScheduledActionStatus.FAILED,
    value: ScheduledActionStatus.FAILED,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <XCircleIcon className="size-4" />
        {ScheduledActionStatus.FAILED}
      </div>
    ),
  },
  {
    id: ScheduledActionStatus.CANCELED,
    value: ScheduledActionStatus.CANCELED,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <XCircleIcon className="size-4" />
        {ScheduledActionStatus.CANCELED}
      </div>
    ),
  },
  {
    id: "PUBLISHED",
    value: "PUBLISHED",
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CheckCircleIcon className="size-4" />
        Published
      </div>
    ),
  },
];

export const ScheduleToolbar = ({
  selectedActionType,
  setSelectedActionType,
  selectedStatus,
  setSelectedStatus,
}: ScheduleToolbarProps) => {
  return (
    <div className="flex items-center gap-2">
      <CommandSelect
        placeholder="Action type"
        className="h-8"
        options={actionTypeOptions}
        onSelect={setSelectedActionType}
        value={selectedActionType}
      />

      <CommandSelect
        placeholder="Status"
        className="h-8"
        options={statusOptions}
        onSelect={setSelectedStatus}
        value={selectedStatus}
      />
    </div>
  );
};
