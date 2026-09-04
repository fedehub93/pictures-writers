"use client";

import * as React from "react";
import { CalendarDays, ChevronDown, Check } from "lucide-react";
import { format, startOfDay, isSameDay, isBefore } from "date-fns";

import { cn } from "@/shared/lib/utils";

import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import { TimePicker, TIME_OPTIONS, TIME_PICKER_FORMAT } from "@/shared/components/time-picker";


interface ScheduleDatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  time: string;
  setTime: (time: string) => void;
  className?: string;
  align?: "start" | "center" | "end";
  renderButton?: (
    isDatePassed: boolean,
    isTimeNotAvailable: boolean,
  ) => React.ReactNode;
}

export function ScheduleDatePicker({
  date,
  setDate,
  time,
  setTime,
  className,
  align = "end",
  renderButton,
}: ScheduleDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const today = React.useMemo(() => startOfDay(new Date()), []);

  const availableTimeOptions = React.useMemo(() => {
    if (!date || !isSameDay(date, new Date())) return TIME_OPTIONS;
    const now = new Date();
    return TIME_OPTIONS.filter((slot) => {
      const [rawHour, rawMinute] = slot.split(":").map(Number);
      const candidate = new Date(date);
      candidate.setHours(rawHour, rawMinute, 0, 0);
      return !isBefore(candidate, now);
    });
  }, [date]);

  React.useEffect(() => {
    if (availableTimeOptions.length === 0) return;

    // Default to the next five-minute slot from now instead of the first
    // slot of the day (midnight), and repair selections that are no longer
    // available for the chosen date (e.g. a past slot on today).
    const minuteMs = 1000 * 60 * 5;
    const defaultTime = format(
      new Date(Math.ceil(new Date().getTime() / minuteMs) * minuteMs),
      TIME_PICKER_FORMAT,
    );

    const nextTime =
      !time || !availableTimeOptions.includes(time)
        ? (availableTimeOptions.includes(defaultTime)
            ? defaultTime
            : availableTimeOptions[0]!)!
        : time;

    if (nextTime !== time) {
      setTime(nextTime);
    }
  }, [availableTimeOptions, setTime, time]);

  const isDatePassed = date
    ? isBefore(date, new Date()) && !isSameDay(date, new Date())
    : false;
  const isTimeNotAvailable = time
    ? !availableTimeOptions.includes(time)
    : false;

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>        <PopoverTrigger asChild>
          <Button
            size="lg"
            className={cn("px-4 w-full", className)}
            variant="outline"
          >
            <span className="flex-1 flex items-center gap-2 text-sm">
              <CalendarDays className="size-4" />
              <span className="flex items-center gap-1.5">
                {date ? format(date, "MMMM d") : "Set Date & Time"}
                {date && time && (
                  <span className="text-muted-foreground">, {time}</span>
                )}
              </span>
            </span>
            <ChevronDown className="size-4!" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-70 p-0" align={align} >
          <div className="w-full p-4 space-y-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={{ before: today }}
              className="p-0 w-full bg-transparent"
              formatters={{
                formatWeekdayName: (date) =>
                  date.toLocaleDateString("en-US", { weekday: "narrow" }),
              }}
              classNames={{
                month_caption: "flex justify-start items-center h-9 ml-2",
                caption_label: "text-base font-semibold",
                nav: "absolute right-2 top-0 flex items-center gap-1",
                month: "space-y-4 w-full",
                day: cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-lg hover:bg-muted transition-colors",
                ),
              }}
            />

            <TimePicker
              value={time}
              onValueChange={handleTimeChange}
              options={availableTimeOptions}
            />
          </div>

          <div className="flex items-center justify-end p-4 border-t bg-muted/5">
            <Button size="lg" className="" onClick={() => setOpen(false)}>
              <Check className="size-4" />
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {renderButton && renderButton(isDatePassed, isTimeNotAvailable)}
    </>
  );
}
