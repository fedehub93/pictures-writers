"use client";

import { useState } from "react";
import { StarIcon } from "lucide-react";

export const RatingStars = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) => {
  const [hover, setHover] = useState<number | null>(null);

  const handleClick = (star: number, isHalf: boolean) => {
    onChange(isHalf ? star - 0.5 : star);
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const displayValue = hover ?? value;
        const isFull = displayValue >= star;
        const isHalf = displayValue >= star - 0.5 && displayValue < star;

        return (
          <div key={star} className="relative">
            {isHalf ? (
              <>
                {/* base empty star for outline */}
                <StarIcon className="size-8 text-border" />
                {/* half filled overlay */}
                <StarIcon
                  className="size-8 text-primary fill-primary absolute top-0 left-0"
                  style={{ clipPath: "inset(0 50% 0 0)" }}
                />
              </>
            ) : (
              <StarIcon
                className={`size-8 ${isFull ? "text-primary fill-primary" : "text-border"}`}
              />
            )}
            {/* Invisible overlays for half clicks */}
            <div
              className="absolute top-0 left-0 w-1/2 h-full cursor-pointer"
              onClick={() => handleClick(star, true)}
              onMouseEnter={() => setHover(star - 0.5)}
              onMouseLeave={() => setHover(null)}
            />
            <div
              className="absolute top-0 right-0 w-1/2 h-full cursor-pointer"
              onClick={() => handleClick(star, false)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(null)}
            />
          </div>
        );
      })}
    </div>
  );
};
