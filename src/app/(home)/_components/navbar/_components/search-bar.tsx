"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { SearchBox } from "@/shared/components/search/search-box";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

/**
 * Mobile search panel of the legacy static navbar.
 *
 * The field, debounce and result list live in the shared `SearchBox`, so the
 * legacy component and the new `SearchBar` Puck block use one implementation.
 * The static navbar itself is kept until the Site-region cutover.
 */
export const SearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button
        role="button"
        size="icon"
        variant="ghost"
        onClick={() => setIsOpen((open) => !open)}
        className="md:hidden"
        aria-label="Toggle search"
      >
        <Search className="h-4 w-4" />
      </Button>
      <div
        className={cn(
          "fixed left-0 top-32 z-50 w-screen overflow-hidden bg-background px-6 opacity-0 shadow-xl transition-all duration-500 md:hidden",
          isOpen ? "h-auto min-h-20 opacity-100" : "h-0",
        )}
      >
        <SearchBox variant="inline" placeholder="Cerca..." className="py-4" />
      </div>
    </div>
  );
};
