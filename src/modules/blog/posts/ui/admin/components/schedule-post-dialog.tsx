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
import { ClockIcon } from "lucide-react";
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
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/shared/ui/input-group";

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
      rescheduleMutation.mutate({ id: postId, rootId, scheduledAt });
    } else {
      scheduleMutation.mutate({ id: postId, rootId, scheduledAt });
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
            <InputGroup>
              <InputGroupAddon>
                <ClockIcon />
              </InputGroupAddon>
              <InputGroupInput
                type="time"
                step="300"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                aria-label="Publication time"
              />
            </InputGroup>
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
