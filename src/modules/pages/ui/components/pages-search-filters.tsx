import { SearchIcon } from "lucide-react";
import { debounce } from "nuqs";

import { Input } from "@/shared/ui/input";
import { usePagesFilters } from "../../hooks/use-pages-filters";

export const PagesSearchFilter = () => {
  const [filters, setFilters] = usePagesFilters();

  return (
    <div className="relative py-4">
      <Input
        placeholder="Filter by title"
        className="h-8 w-37.5 lg:w-62.5 pl-7"
        value={filters.search}
        onChange={(e) =>
          setFilters(
            { search: e.target.value },
            { limitUrlUpdates: debounce(500) },
          )
        }
      />
      <SearchIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2" />
    </div>
  );
};
