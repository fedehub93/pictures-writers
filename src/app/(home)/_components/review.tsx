"use client";

import { CircleCheckIcon, StarIcon } from "lucide-react";

import { formatDate } from "@/lib/format";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";

export const ReviewStars = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const displayValue = rating || 0;
        const isFull = displayValue >= star;
        const isHalf = displayValue >= star - 0.5 && displayValue < star;

        return (
          <div key={star} className="relative">
            {isHalf ? (
              <>
                {/* base empty star for outline */}
                <StarIcon className="size-4 text-border" />
                {/* half filled overlay */}
                <StarIcon
                  className="size-4 text-primary fill-primary absolute top-0 left-0"
                  style={{ clipPath: "inset(0 50% 0 0)" }}
                />
              </>
            ) : (
              <StarIcon
                className={`size-4 ${isFull ? "text-primary fill-primary" : "text-border"}`}
              />
            )}
            {/* Invisible overlays for half clicks */}
            <div className="absolute top-0 left-0 w-1/2 h-full" />
            <div className="absolute top-0 right-0 w-1/2 h-full" />
          </div>
        );
      })}
    </div>
  );
};

export const Review = ({
  name,
  role,
  rating,
  comment,
  date,
  verifiedPurchase,
  truncate = false,
  showStars = false,
  ActionButton,
}: {
  name: string;
  role: string;
  rating: number;
  comment: string;
  date: Date;
  verifiedPurchase: boolean;
  truncate?: boolean;
  showStars?: boolean;
  ActionButton?: React.ReactNode;
}) => {
  return (
    <>
      <div className="flex justify-between items-center mb-6 relative">
        <div className="flex items-center gap-4">
          <div className="size-8 sm:size-12 rounded-full bg-linear-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center text-lg font-black">
            {name
              ? name
                  .split(" ")
                  .filter(Boolean)
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 1)
                  .toUpperCase()
              : "?"}
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-foreground">
              {name}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-1">{role}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          {verifiedPurchase && (
            <div className="flex gap-x-2 text-primary">
              <CircleCheckIcon className="size-4" />
              <span className="text-[10px] hidden sm:block">
                Acquisto verificato
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {formatDate({ date })}
          </p>
        </div>
      </div>
      <div className="relative mb-4">
        <span className="absolute -top-4 -left-2 text-6xl text-primary/10 font-serif">
          “
        </span>
        <p
          className={cn(
            "text-muted-foreground leading-relaxed relative z-10 text-justify",
            truncate && "line-clamp-3",
          )}
        >
          {comment}
        </p>
      </div>
      <div className="flex justify-between items-center">
        {showStars && <ReviewStars rating={rating} />}
        {ActionButton && ActionButton}
      </div>
    </>
  );
};
