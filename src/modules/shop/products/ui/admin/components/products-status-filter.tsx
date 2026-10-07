"use client";

import { CheckCircleIcon, CircleIcon, TimerIcon } from "lucide-react";

import { CommandSelect } from "@/shared/components/command-select";

import { DEFAULT_PAGE } from "../../../constants";
import { useProductsFilters } from "../../../hooks/use-products-filters";

const options = [
  {
    id: "all",
    value: "",
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <CircleIcon />
        All
      </div>
    ),
  },
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

export const ProductsStatusFilter = () => {
  const [filters, setFilters] = useProductsFilters();

  return (
    <CommandSelect
      placeholder="Status"
      className="h-8"
      options={options}
      onSelect={(value) =>
        setFilters({
          status: (value || null) as "DRAFT" | "CHANGED" | "PUBLISHED" | null,
          page: DEFAULT_PAGE,
        })
      }
      value={filters.status ?? ""}
    />
  );
};
