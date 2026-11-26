"use client";

import {
  MEDIA_LIBRARY_SORTS,
  type MediaLibrarySort,
} from "../../constants";

const SORT_LABELS: Record<MediaLibrarySort, string> = {
  created: "Created",
  name: "Name",
  size: "Size",
};

interface MediaSortSelectProps {
  value: MediaLibrarySort;
  onChange: (sort: MediaLibrarySort) => void;
}

/**
 * The order of the My Drive and Archived list. It sits beside the breadcrumb or
 * the Archived title, so it carries no visible label: its accessible name is
 * "Sort by" and the options name the order the fixed direction applies to.
 */
export const MediaSortSelect = ({
  value,
  onChange,
}: MediaSortSelectProps) => (
  <select
    aria-label="Sort by"
    className="h-8 rounded-md border bg-background px-2 text-sm"
    value={value}
    onChange={(event) => onChange(event.target.value as MediaLibrarySort)}
  >
    {MEDIA_LIBRARY_SORTS.map((sort) => (
      <option key={sort} value={sort}>
        {SORT_LABELS[sort]}
      </option>
    ))}
  </select>
);
