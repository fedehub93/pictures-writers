"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { addMinutes, format, startOfDay } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";

/**
 * Shared 24h time format used by every scheduling dialog so picks are
 * consistent across the UI.
 */
export const TIME_PICKER_FORMAT = "HH:mm";

/** Five-minute time slots for the whole day, in 24h format. */
export const TIME_OPTIONS: string[] = Array.from({ length: 24 * 12 }, (_, i) =>
  format(addMinutes(startOfDay(new Date()), i * 5), TIME_PICKER_FORMAT),
);

interface TimePickerProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  /** Optional heading rendered above the select. Omit it when the surrounding form already provides a label. */
  title?: string;
  className?: string;
}

export function TimePicker({
  value,
  onValueChange,
  options,
  placeholder = "Select time",
  title,
  className,
}: TimePickerProps) {
  return (
    <div className="space-y-1">
      {title && (
        <h4 className="text-[13px] font-semibold text-foreground/70">
          {title}
        </h4>
      )}
      <div className="flex items-center gap-2">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className={cn("w-full", className)}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-50">
            {options.map((time) => (
              <SelectItem key={time} value={time}>
                <div className="flex items-center gap-2">
                  <Clock className="size-3" />
                  {time}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}