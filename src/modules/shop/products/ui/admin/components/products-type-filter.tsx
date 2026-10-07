"use client";

import {
  BookText,
  CircleIcon,
  ClipboardPen,
  ExternalLink,
  Headset,
} from "lucide-react";

import { ProductType } from "@/generated/prisma";

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
    id: ProductType.EBOOK,
    value: ProductType.EBOOK,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <BookText />
        Ebook
      </div>
    ),
  },
  {
    id: ProductType.SERVICE,
    value: ProductType.SERVICE,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <ClipboardPen />
        Service
      </div>
    ),
  },
  {
    id: ProductType.AFFILIATE,
    value: ProductType.AFFILIATE,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <ExternalLink />
        Affiliate
      </div>
    ),
  },
  {
    id: ProductType.WEBINAR,
    value: ProductType.WEBINAR,
    children: (
      <div className="flex items-center gap-x-2 capitalize">
        <Headset />
        Webinar
      </div>
    ),
  },
];

export const ProductsTypeFilter = () => {
  const [filters, setFilters] = useProductsFilters();

  return (
    <CommandSelect
      placeholder="Type"
      className="h-8"
      options={options}
      onSelect={(value) =>
        setFilters({
          type: (value || null) as ProductType | null,
          page: DEFAULT_PAGE,
        })
      }
      value={filters.type ?? ""}
    />
  );
};
