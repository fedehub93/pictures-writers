"use client";

import { SearchIcon } from "lucide-react";
import { debounce } from "nuqs";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";

import { DEFAULT_PAGE } from "../../../constants";
import { useProductCategoriesFilters } from "../../../hooks/use-product-categories-filters";

export const ProductCategoriesSearchFilter = () => {
  const [filters, setFilters] = useProductCategoriesFilters();

  return (
    <InputGroup className="max-w-xs">
      <InputGroupInput
        placeholder="Search categories"
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
