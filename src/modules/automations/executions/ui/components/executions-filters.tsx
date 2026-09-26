"use client";

import { CircleIcon } from "lucide-react";

import { AutomationRunStatus } from "@/generated/prisma";

import { CommandSelect } from "@/shared/components/command-select";

import { Input } from "@/shared/ui/input";

import { AUTOMATION_RUN_STATUSES, DEFAULT_PAGE } from "../../../constants";
import { useExecutionsFilters } from "../../hooks/use-executions";

import { RUN_STATUS_META } from "./run-status-badge";

const statusOptions = [
  {
    id: "all",
    value: null,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CircleIcon />
        All statuses
      </div>
    ),
  },
  ...AUTOMATION_RUN_STATUSES.map((status) => {
    const { Icon } = RUN_STATUS_META[status];

    return {
      id: status,
      value: status,
      children: (
        <div className="flex items-center gap-x-2 capitalize">
          <Icon />
          {status}
        </div>
      ),
    };
  }),
];

export const ExecutionsFilters = () => {
  const [filters, setFilters] = useExecutionsFilters();

  return (
    <div className="flex items-center gap-x-2">
      <CommandSelect
        placeholder="Status"
        className="h-8"
        options={statusOptions}
        onSelect={(value) =>
          setFilters({
            status: value as AutomationRunStatus | null,
            page: DEFAULT_PAGE,
          })
        }
        value={filters.status ?? ""}
      />
      <Input
        type="date"
        aria-label="From date"
        className="h-8 w-38"
        value={filters.from ?? ""}
        onChange={(event) =>
          setFilters({
            from: event.target.value || null,
            page: DEFAULT_PAGE,
          })
        }
      />
      <span className="text-sm text-muted-foreground">to</span>
      <Input
        type="date"
        aria-label="To date"
        className="h-8 w-38"
        value={filters.to ?? ""}
        onChange={(event) =>
          setFilters({
            to: event.target.value || null,
            page: DEFAULT_PAGE,
          })
        }
      />
    </div>
  );
};
