"use client";

import {
  Ban,
  CheckCircleIcon,
  ChevronDown,
  CircleDashedIcon,
  CircleIcon,
  ClockIcon,
  MailIcon,
  NotebookPenIcon,
  TimerIcon,
  XCircleIcon,
} from "lucide-react";

import { ScheduledActionStatus, ScheduledActionType } from "@/generated/prisma";

import {
  CALENDAR_FILTER_ALL,
  useCalendarFilters,
} from "@/modules/scheduler/hooks/use-calendar-filters";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

const actionTypeOptions = [
  { value: "all", label: "All actions", Icon: CircleIcon },
  {
    value: ScheduledActionType.PUBLISH_POST,
    label: "Post publication",
    Icon: NotebookPenIcon,
  },
  {
    value: ScheduledActionType.SEND_EMAIL,
    label: "Email send",
    Icon: MailIcon,
  },
];

const statusOptions = [
  { value: "all", label: "All statuses", Icon: CircleIcon },
  { value: ScheduledActionStatus.SCHEDULED, label: "Scheduled", Icon: ClockIcon },
  {
    value: ScheduledActionStatus.PROCESSING,
    label: "Processing",
    Icon: CircleDashedIcon,
  },
  {
    value: ScheduledActionStatus.RETRY_WAIT,
    label: "Retry wait",
    Icon: TimerIcon,
  },
  {
    value: ScheduledActionStatus.SUCCEEDED,
    label: "Succeeded",
    Icon: CheckCircleIcon,
  },
  { value: ScheduledActionStatus.FAILED, label: "Failed", Icon: XCircleIcon },
  {
    value: ScheduledActionStatus.CANCELED,
    label: "Canceled",
    Icon: Ban,
  },
  {
    value: "PUBLISHED",
    label: "Published",
    Icon: CheckCircleIcon,
  },
];

export const SchedulerToolbar = () => {
  const [filters, setFilters] = useCalendarFilters();
  const selectedActionType = filters.actionType;
  const selectedStatus = filters.status;

  const setSelectedActionType = (value: string) => {
    setFilters({ actionType: value ?? CALENDAR_FILTER_ALL });
  };

  const setSelectedStatus = (value: string) => {
    setFilters({ status: value ?? CALENDAR_FILTER_ALL });
  };

  const selectedAction = actionTypeOptions.find(
    (option) => option.value === selectedActionType,
  );
  const selectedStatusOption = statusOptions.find(
    (option) => option.value === selectedStatus,
  );

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-8 min-w-44 justify-between gap-2 px-3 font-normal"
          >
            <span className="flex items-center gap-2 whitespace-nowrap">
              {selectedAction ? (
                <>
                  <selectedAction.Icon className="size-4 shrink-0" />
                  {selectedAction.label}
                </>
              ) : (
                "Action type"
              )}
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuRadioGroup
            value={selectedActionType}
            onValueChange={(value) => setSelectedActionType(value)}
          >
            {actionTypeOptions.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <option.Icon className="size-4" />
                <span className="ml-2">{option.label}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-8 min-w-40 justify-between gap-2 px-3 font-normal"
          >
            <span className="flex items-center gap-2 whitespace-nowrap">
              {selectedStatusOption ? (
                <>
                  <selectedStatusOption.Icon className="size-4 shrink-0" />
                  {selectedStatusOption.label}
                </>
              ) : (
                "Status"
              )}
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuRadioGroup
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value)}
          >
            {statusOptions.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <option.Icon className="size-4" />
                <span className="ml-2">{option.label}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};