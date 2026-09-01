import { CheckCircleIcon, CircleIcon, TimerIcon } from "lucide-react";

import { CommandSelect } from "@/shared/components/command-select";

import { useTagsFilters } from "../../hooks/use-tags-filters";

const options = [
  {
    id: "DRAFT",
    value: "DRAFT",
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CircleIcon />
        Draft
      </div>
    ),
  },
  {
    id: "CHANGED",
    value: "CHANGED",
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <TimerIcon />
        Changed
      </div>
    ),
  },
  {
    id: "PUBLISHED",
    value: "PUBLISHED",
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CheckCircleIcon />
        Published
      </div>
    ),
  },
];

export const StatusFilter = () => {
  const [filters, setFilters] = useTagsFilters();

  return (
    <CommandSelect
      placeholder="Status"
      className="h-8"
      options={options}
      onSelect={(value) =>
        setFilters({ status: value as "DRAFT" | "CHANGED" | "PUBLISHED" })
      }
      value={filters.status ?? ""}
    />
  );
};
