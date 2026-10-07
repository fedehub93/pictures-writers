"use client";

import { SearchIcon } from "lucide-react";
import { debounce } from "nuqs";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";

import { DEFAULT_PAGE } from "../../../constants";
import { useReviewsFilters } from "../../../hooks/use-reviews-filters";

export const ReviewsSearchFilter = () => {
  const [filters, setFilters] = useReviewsFilters();

  return (
    <InputGroup className="max-w-xs">
      <InputGroupInput
        placeholder="Search by reviewer or comment"
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
