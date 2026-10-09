"use client";

import { CircleIcon } from "lucide-react";

import { CommandSelect } from "@/shared/components/command-select";

import { DEFAULT_PAGE } from "../../../constants";
import { useProductOptions } from "../../../hooks/use-product-options";
import { useReviewsFilters } from "../../../hooks/use-reviews-filters";

export const ReviewsProductFilter = () => {
  const [filters, setFilters] = useReviewsFilters();
  const { data } = useProductOptions();

  const options = [
    {
      id: "all",
      value: null,
      children: (
        <div className="flex items-center gap-x-2">
          <CircleIcon />
          All products
        </div>
      ),
    },
    ...(data?.items ?? []).map((product) => ({
      id: product.rootId,
      value: product.rootId,
      children: <span className="truncate">{product.title}</span>,
    })),
  ];

  return (
    <CommandSelect
      placeholder="Product"
      className="h-8 max-w-60"
      options={options}
      onSelect={(value) =>
        setFilters({ product: value, page: DEFAULT_PAGE })
      }
      value={filters.product ?? ""}
    />
  );
};
