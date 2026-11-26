"use client";

import { SearchIcon } from "lucide-react";
import { debounce } from "nuqs";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";

import { MEDIA_SEARCH_DEBOUNCE_MS } from "../../constants";
import { useMediaFilters } from "../../hooks/use-media-filters";

/**
 * Search by name with the debounce and the `search` parameter the other lists
 * use. Editing the term starts the list over from its first block, so a
 * filtered list never opens midway through results the editor has not seen.
 */
export const MediaSearchFilter = () => {
  const [filters, setFilters] = useMediaFilters();

  return (
    <InputGroup>
      <InputGroupInput
        placeholder="Search by name"
        value={filters.search}
        onChange={(event) =>
          setFilters(
            { search: event.target.value },
            { limitUrlUpdates: debounce(MEDIA_SEARCH_DEBOUNCE_MS) },
          )
        }
      />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
    </InputGroup>
  );
};
