"use client";

import { useState, type ReactNode, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfDay,
  setHours,
  setMinutes,
  setSeconds,
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

import {
  TimePicker,
  TIME_OPTIONS,
  TIME_PICKER_FORMAT,
} from "@/shared/components/time-picker";

interface ScheduleSingleSendDialogProps {
  singleSendId: string;
  mode?: "schedule" | "reschedule";
  currentScheduledAt?: Date | null;
  trigger: ReactNode;
  onSuccess?: () => void;
}

function roundUpToNextFiveMinutes(date: Date): Date {
  const ms = 1000 * 60 * 5;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

function buildScheduledAt(date: Date, time: string): Date | null {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return setSeconds(setMinutes(setHours(date, hours), minutes), 0);
}

export const ScheduleSingleSendDialog = ({
  singleSendId,
  mode = "schedule",
  currentScheduledAt,
  trigger,
  onSuccess,
}: ScheduleSingleSendDialogProps) => {
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
    setTime(format(defaultScheduledAt, TIME_PICKER_FORMAT));
    setValidationError(null);
  }, [currentScheduledAt]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetToDefault();
    }
    setOpen(nextOpen);
  };

  const invalidateSchedule = () => {
    queryClient.invalidateQueries(
      trpc.singleSends.getSchedule.queryFilter({ singleSendId }),
    );
    queryClient.invalidateQueries(
      trpc.scheduler.getCalendarEvents.queryFilter(),
    );
    queryClient.invalidateQueries(trpc.singleSends.getMany.queryFilter());
  };

  const scheduleMutation = useMutation(
    trpc.singleSends.schedule.mutationOptions({
      onSuccess: () => {
        toast.success(
          mode === "reschedule"
            ? "Send rescheduled successfully"
            : "Send scheduled successfully",
        );
        invalidateSchedule();
        onSuccess?.();
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to schedule the send");
      },
    }),
  );

  const rescheduleMutation = useMutation(
    trpc.singleSends.reschedule.mutationOptions({
      onSuccess: () => {
        toast.success("Send rescheduled successfully");
        invalidateSchedule();
        onSuccess?.();
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to reschedule the send");
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
      rescheduleMutation.mutate({
        singleSendId,
        scheduledAt,
        timezone: timeZone,
      });
    } else {
      scheduleMutation.mutate({
        singleSendId,
        scheduledAt,
        timezone: timeZone,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "reschedule"
              ? "Reschedule newsletter send"
              : "Schedule newsletter send"}
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
              options={TIME_OPTIONS}
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
