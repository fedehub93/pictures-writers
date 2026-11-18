"use client";

import { Button } from "@/shared/ui/button";

import { DEFAULT_PAGE, type MediaLibraryView } from "../../constants";
import { useMediaFilters } from "../../hooks/use-media-filters";

const VIEWS: { value: MediaLibraryView; label: string }[] = [
  { value: "active", label: "Library" },
  { value: "archived", label: "Archived" },
];

/**
 * Switching view keeps the search term and resets the page: a page number
 * only exists inside the view it was counted in.
 */
export const MediaViewSwitch = () => {
  const [filters, setFilters] = useMediaFilters();

  return (
    <div className="flex items-center gap-x-2">
      {VIEWS.map((view) => (
        <Button
          key={view.value}
          type="button"
          size="sm"
          variant={filters.view === view.value ? "default" : "outline"}
          onClick={() => setFilters({ view: view.value, page: DEFAULT_PAGE })}
        >
          {view.label}
        </Button>
      ))}
    </div>
  );
};
