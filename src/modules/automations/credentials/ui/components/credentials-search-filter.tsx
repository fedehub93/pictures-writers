"use client";

import { SearchIcon } from "lucide-react";
import { debounce } from "nuqs";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";

import { useCredentialsFilters } from "../../hooks/use-credentials-filters";

export const CredentialsSearchFilter = () => {
  const [filters, setFilters] = useCredentialsFilters();

  return (
    <InputGroup>
      <InputGroupInput
        placeholder="Filter by name or type"
        value={filters.search}
        onChange={(e) =>
          setFilters(
            { search: e.target.value },
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
