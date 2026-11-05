"use client";
import "client-only";

import { useId } from "react";

import { SearchBox } from "@/shared/components/search/search-box";

/**
 * Sidebar search widget.
 *
 * The search field, debounce and result list live in the shared `SearchBox`;
 * the widget only supplies the sidebar-specific frame and heading.
 */
export const WidgetSearchBox = () => {
  const searchId = useId();

  return (
    <div className="hidden w-full bg-background px-6 py-8 shadow-md md:block">
      <label
        htmlFor={searchId}
        className="mb-4 block text-sm font-extrabold uppercase"
      >
        Cerca
      </label>
      <SearchBox id={searchId} variant="inline" placeholder="Search..." />
    </div>
  );
};
