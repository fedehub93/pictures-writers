"use client";

import { SearchIcon } from "lucide-react";
import { debounce } from "nuqs";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";

import { DEFAULT_PAGE } from "../../../constants";
import { useProductsFilters } from "../../../hooks/use-products-filters";

export const ProductsSearchFilter = () => {
  const [filters, setFilters] = useProductsFilters();

  return (
    <InputGroup className="max-w-xs">
      <InputGroupInput
        placeholder="Search products"
        value={filters.search}
        onChange={(event) =>
          setFilters(
            { search: event.target.value, page: DEFAULT_PAGE },
            { limitUrlUpdates: debounce(500) },
          )
        }
      />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
    </InputGroup>
  );
};
