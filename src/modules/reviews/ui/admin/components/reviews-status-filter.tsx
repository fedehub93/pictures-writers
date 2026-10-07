"use client";

import { CheckCircleIcon, CircleDashedIcon, CircleIcon } from "lucide-react";

import { CommandSelect } from "@/shared/components/command-select";

import { DEFAULT_PAGE } from "../../../constants";
import { useReviewsFilters } from "../../../hooks/use-reviews-filters";

const options = [
  {
    id: "all",
    value: null,
    children: (
      <div className="flex items-center gap-x-2">
        <CircleIcon />
        All
      </div>
    ),
  },
  {
    id: "published",
    value: "true",
    children: (
      <div className="flex items-center gap-x-2">
        <CheckCircleIcon />
        Published
      </div>
    ),
  },
  {
    id: "draft",
    value: "false",
    children: (
      <div className="flex items-center gap-x-2">
        <CircleDashedIcon />
        Unpublished
      </div>
    ),
  },
];

export const ReviewsStatusFilter = () => {
  const [filters, setFilters] = useReviewsFilters();

  return (
    <CommandSelect
      placeholder="Status"
      className="h-8"
      options={options}
      onSelect={(value) =>
        setFilters({
          status: value === null ? null : value === "true",
          page: DEFAULT_PAGE,
        })
      }
      value={
        filters.status === null || filters.status === undefined
          ? ""
          : String(filters.status)
      }
    />
  );
};
