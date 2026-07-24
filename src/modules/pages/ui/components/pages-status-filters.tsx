import { CheckCircleIcon, CircleIcon, TimerIcon } from "lucide-react";

import { ContentStatus } from "@/generated/prisma";

import { CommandSelect } from "@/shared/components/command-select";

import { usePagesFilters } from "../../hooks/use-pages-filters";

const options = [
  {
    id: ContentStatus.DRAFT,
    value: ContentStatus.DRAFT,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CircleIcon />
        {ContentStatus.DRAFT}
      </div>
    ),
  },
  {
    id: ContentStatus.CHANGED,
    value: ContentStatus.CHANGED,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <TimerIcon />
        {ContentStatus.CHANGED}
      </div>
    ),
  },
  {
    id: ContentStatus.PUBLISHED,
    value: ContentStatus.PUBLISHED,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CheckCircleIcon />
        {ContentStatus.PUBLISHED}
      </div>
    ),
  },
];

export const StatusFilter = () => {
  const [filters, setFilters] = usePagesFilters();

  return (
    <CommandSelect
      placeholder="Status"
      className="h-8"
      options={options}
      onSelect={(value) => setFilters({ status: value as ContentStatus })}
      value={filters.status ?? ""}
    />
  );
};
