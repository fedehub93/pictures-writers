"use client";

import { SearchIcon } from "lucide-react";
import { debounce } from "nuqs";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";

import { usePostsFilters } from "../../../hooks/use-posts-filters";

export const PostsSearchFilter = () => {
  const [filters, setFilters] = usePostsFilters();

  return (
    <InputGroup className="max-w-xs h-8">
      <InputGroupInput
        placeholder="Filter by title"
        value={filters.search}
        onChange={(e) =>
          setFilters(
            { search: e.target.value },
            { limitUrlUpdates: debounce(500) },
          )
        }
      />{" "}
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
    </InputGroup>
  );
};
