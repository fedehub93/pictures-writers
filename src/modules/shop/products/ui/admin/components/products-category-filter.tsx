"use client";

import { CircleIcon, FolderIcon } from "lucide-react";

import { CommandSelect } from "@/shared/components/command-select";

import { useProductCategoriesQuery } from "@/modules/shop/product-categories/hooks/use-product-categories";

import { DEFAULT_PAGE } from "../../../constants";
import { useProductsFilters } from "../../../hooks/use-products-filters";

export const ProductsCategoryFilter = () => {
  const [filters, setFilters] = useProductsFilters();
  const { data: categories } = useProductCategoriesQuery();

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
    ...(categories ?? []).map((category) => {
      const value = category.id;

      return {
        id: value,
        value,
        children: (
          <div className="flex items-center gap-x-2">
            <FolderIcon />
            {category.title}
          </div>
        ),
      };
    }),
  ];

  return (
    <CommandSelect
      placeholder="Category"
      className="h-8"
      options={options}
      onSelect={(value) =>
        setFilters({ category: value || null, page: DEFAULT_PAGE })
      }
      value={filters.category ?? ""}
    />
  );
};
