"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

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
  <Select
    value={value}
    onValueChange={(next) => onChange(next as MediaLibrarySort)}
  >
    <SelectTrigger size="sm" aria-label="Sort by" className="min-w-28">
      <SelectValue />
    </SelectTrigger>
    <SelectContent position="popper" align="end">
      {MEDIA_LIBRARY_SORTS.map((sort) => (
        <SelectItem key={sort} value={sort}>
          {SORT_LABELS[sort]}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
