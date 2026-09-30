"use client";

import { CheckCircleIcon, CircleDashedIcon, CircleIcon } from "lucide-react";

import { AutomationStatus } from "@/generated/prisma";

import { CommandSelect } from "@/shared/components/command-select";

import { useAutomationsFilters } from "../../../hooks/use-automations-filters";

const options = [
  {
    id: "all",
    value: null,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CircleIcon />
        All
      </div>
    ),
  },
  {
    id: AutomationStatus.DRAFT,
    value: AutomationStatus.DRAFT,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CircleDashedIcon />
        {AutomationStatus.DRAFT}
      </div>
    ),
  },
  {
    id: AutomationStatus.PUBLISHED,
    value: AutomationStatus.PUBLISHED,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CheckCircleIcon />
        {AutomationStatus.PUBLISHED}
      </div>
    ),
  },
];

export const AutomationsStatusFilter = () => {
  const [filters, setFilters] = useAutomationsFilters();

  return (
    <CommandSelect
      placeholder="Status"
      className="h-8"
      options={options}
      onSelect={(value) => setFilters({ status: value as AutomationStatus })}
      value={filters.status ?? ""}
    />
  );
};