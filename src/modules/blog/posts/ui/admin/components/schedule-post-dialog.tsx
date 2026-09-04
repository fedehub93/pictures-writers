"use client";

import { useState, type ReactNode, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfDay,
  setHours,
  setMinutes,
  setSeconds,
  addMinutes,
  isBefore,
} from "date-fns";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Calendar } from "@/shared/ui/calendar";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";

import { TimePicker } from "@/shared/components/time-picker";

interface SchedulePostDialogProps {
  postId: string;
  rootId: string;
  mode?: "schedule" | "reschedule";
  currentScheduledAt?: Date | null;
  trigger: ReactNode;
  onSuccess?: () => void;
}

function roundUpToNextFiveMinutes(date: Date): Date {
  const ms = 1000 * 60 * 5;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

const timeOptions = Array.from({ length: 24 * 12 }, (_, i) =>
  format(addMinutes(startOfDay(new Date()), i * 5), "HH:mm"),
);

function buildScheduledAt(date: Date, time: string): Date | null {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return setSeconds(setMinutes(setHours(date, hours), minutes), 0);
}

export const SchedulePostDialog = ({
  postId,
  rootId,
  mode = "schedule",
  currentScheduledAt,
  trigger,
  onSuccess,
}: SchedulePostDialogProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const resetToDefault = useCallback(() => {
    const now = new Date();
    const defaultScheduledAt = currentScheduledAt
      ? new Date(currentScheduledAt)
      : roundUpToNextFiveMinutes(now);

    setDate(startOfDay(defaultScheduledAt));
    setTime(format(defaultScheduledAt, "HH:mm"));
    setValidationError(null);
  }, [currentScheduledAt]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetToDefault();
    }
    setOpen(nextOpen);
  };

  const invalidatePosts = () => {
    queryClient.invalidateQueries(trpc.posts.getMany.queryFilter());
    queryClient.invalidateQueries(
      trpc.posts.getLastByRootId.queryFilter({ rootId }),
    );
    queryClient.invalidateQueries(
      trpc.scheduler.getCalendarEvents.queryFilter(),
    );
  };

  const scheduleMutation = useMutation(
    trpc.posts.schedule.mutationOptions({
      onSuccess: () => {
        toast.success(
          mode === "reschedule"
            ? "Schedule updated successfully"
            : "Post scheduled successfully",
        );
        invalidatePosts();
        onSuccess?.();
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to schedule the post");
      },
    }),
  );

  const rescheduleMutation = useMutation(
    trpc.posts.reschedule.mutationOptions({
      onSuccess: () => {
        toast.success("Schedule updated successfully");
        invalidatePosts();
        onSuccess?.();
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to reschedule the post");
      },
    }),
  );

  const isPending = scheduleMutation.isPending || rescheduleMutation.isPending;

  const handleSubmit = () => {
    setValidationError(null);

    if (!date) {
      setValidationError("Please select a date");
      return;
    }

    const scheduledAt = buildScheduledAt(date, time);

    if (!scheduledAt) {
      setValidationError("Please select a valid time");
      return;
    }

    const now = new Date();
    if (isBefore(scheduledAt, now)) {
      setValidationError("Scheduled time must be in the future");
      return;
    }

    if (mode === "reschedule") {
      rescheduleMutation.mutate({ id: postId, rootId, scheduledAt, timezone: timeZone });
    } else {
      scheduleMutation.mutate({ id: postId, rootId, scheduledAt, timezone: timeZone });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "reschedule"
              ? "Reschedule publication"
              : "Schedule publication"}
          </DialogTitle>
          <DialogDescription>
            Choose a future date and time. Times are interpreted in your browser
            timezone ({timeZone}).
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel>Date</FieldLabel>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={[{ before: new Date() }]}
              className="mx-auto [--cell-size:2rem]"
            />
          </Field>

          <Field>
            <FieldLabel>Time</FieldLabel>
            <TimePicker
              value={time}
              onValueChange={setTime}
              options={timeOptions}
            />
          </Field>

          {validationError && <FieldError>{validationError}</FieldError>}
        </FieldGroup>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={isPending} onClick={handleSubmit}>
            {mode === "reschedule" ? "Reschedule" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
