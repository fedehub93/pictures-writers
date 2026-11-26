"use client";

import { ChevronDown, Loader2 } from "lucide-react";

import { Button } from "@/shared/ui/button";

interface MediaViewMoreProps {
  /** Asks the surface for its next block, or reveals it locally. */
  onClick: () => void;
  /** Shows a spinner and refuses a second activation while a block loads. */
  isLoading?: boolean;
}

/**
 * The one "View more" control the library surfaces share: a centered button
 * under a grid. The Recent box reveals locally and passes no loading state; the
 * library's load-more passes its fetching state. It is presentational and owns
 * no data.
 */
export const MediaViewMore = ({
  onClick,
  isLoading = false,
}: MediaViewMoreProps) => {
  return (
    <div className="flex justify-center py-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isLoading}
        aria-busy={isLoading || undefined}
        onClick={onClick}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <ChevronDown />
        )}
        View more
      </Button>
    </div>
  );
};
