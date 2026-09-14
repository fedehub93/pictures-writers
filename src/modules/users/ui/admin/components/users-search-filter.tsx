"use client";

import { SearchIcon } from "lucide-react";
import { debounce } from "nuqs";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";

import { useUsersFilters } from "@/modules/users/hooks/use-users-filters";

export const UsersSearchFilter = () => {
  const [filters, setFilters] = useUsersFilters();

  return (
    <InputGroup className="w-37.5 lg:w-62.5">
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
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
    </InputGroup>
  );
};
