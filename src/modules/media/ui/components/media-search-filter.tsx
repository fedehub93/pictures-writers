"use client";

import { SearchIcon } from "lucide-react";
import { debounce } from "nuqs";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";

import { DEFAULT_PAGE } from "../../constants";
import { useMediaFilters } from "../../hooks/use-media-filters";

/**
 * Search by name with the debounce and the `search` parameter the other lists
 * use. Editing the term returns to page 1, so a filtered list never opens on a
 * page that only exists because of the previous term.
 */
export const MediaSearchFilter = () => {
  const [filters, setFilters] = useMediaFilters();

  return (
    <InputGroup>
      <InputGroupInput
        placeholder="Filter by name"
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
