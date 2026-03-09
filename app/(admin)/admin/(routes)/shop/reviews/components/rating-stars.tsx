"use client";

import { useState } from "react";
import { StarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export const RatingStars = ({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled: boolean;
}) => {
  const [hover, setHover] = useState<number | null>(null);

  const handleClick = (star: number, isHalf: boolean) => {
    if (!disabled) {
      onChange(isHalf ? star - 0.5 : star);
    }
  };

  const onMouseEnter = (rating: number | null) => {
    if (!disabled) {
      setHover(rating);
    }
  };

  const onMouseLeave = (rating: number | null) => {
    if (!disabled) {
      setHover(rating);
    }
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
            <Button
              type="button"
              variant="ghost"
              className="absolute top-0 left-0 w-1/2 h-full cursor-pointer hover:bg-transparent p-0"
              onClick={() => handleClick(star, true)}
              onMouseEnter={() => onMouseEnter(star - 0.5)}
              onMouseLeave={() => onMouseLeave(null)}
              disabled={disabled}
            />
            <Button
              type="button"
              variant="ghost"
              className="absolute top-0 right-0 w-1/2 h-full cursor-pointer hover:bg-transparent p-0"
              onClick={() => handleClick(star, false)}
              onMouseEnter={() => onMouseEnter(star)}
              onMouseLeave={() => onMouseLeave(null)}
              disabled={disabled}
            />
          </div>
        );
      })}
    </div>
  );
};
