"use client";

import { SearchIcon } from "lucide-react";
import { debounce } from "nuqs";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";

import { useAutomationsFilters } from "../../../hooks/use-automations-filters";

export const AutomationsSearchFilter = () => {
  const [filters, setFilters] = useAutomationsFilters();

  return (
    <InputGroup>
      <InputGroupInput
        placeholder="Filter by name"
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