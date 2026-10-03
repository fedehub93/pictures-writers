"use client";

import { SearchIcon } from "lucide-react";
import { debounce } from "nuqs";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";

import { DEFAULT_PAGE } from "../../constants";
import { useCustomerFilters } from "../../hooks/use-customers-filter";

export const CustomersSearchFilter = () => {
  const [filters, setFilters] = useCustomerFilters();

  return (
    <InputGroup className="max-w-xs">
      <InputGroupInput
        placeholder="Search by email or name"
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
