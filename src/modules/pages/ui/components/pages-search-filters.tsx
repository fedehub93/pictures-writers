"use client";

import { SearchIcon } from "lucide-react";
import { debounce } from "nuqs";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";

import { usePagesFilters } from "../../hooks/use-pages-filters";

export const PagesSearchFilter = () => {
  const [filters, setFilters] = usePagesFilters();

  return (
    <InputGroup className="h-8 w-37.5 lg:w-62.5">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        placeholder="Filter by title"
        value={filters.search}
        onChange={(e) =>
          setFilters(
            { search: e.target.value },
            { limitUrlUpdates: debounce(500) },
          )
        }
      />
    </InputGroup>
  );
};
