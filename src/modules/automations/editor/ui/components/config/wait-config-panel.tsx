"use client";

import { format, setHours, setMinutes, setSeconds } from "date-fns";

import type { NodeConfigPanelProps } from "@/modules/automations/editor/config/node-config-panel-types";
import { parseDurationValue } from "@/modules/automations/lib/duration";
import { DAY_MS } from "@/modules/automations/lib/time-zone";
import {
  TimePicker,
  TIME_OPTIONS,
  TIME_PICKER_FORMAT,
} from "@/shared/components/time-picker";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";

type WaitMode = "delay" | "until";
/// In the delay editor the author either picks an amount+unit or writes a raw
/// duration/expression (`"{{ payload.days }} days"`) resolved at run time.
type WaitDelayMode = "value" | "expression";

/// Largest unit first: a delay is edited in the biggest whole unit it fits.
const UNIT_MS: Record<string, number> = {
  weeks: 7 * DAY_MS,
  days: DAY_MS,
  hours: 60 * 60 * 1000,
  minutes: 60 * 1000,
};

/// Units that can be anchored to a time of day. "2 days at 09:00" only makes
/// sense for whole days (or weeks), never for hours/minutes.
const ANCHORED_UNITS = new Set(["weeks", "days"]);

const DELAY_UNITS = Object.keys(UNIT_MS).map((unit) => ({
  value: unit,
  label: unit.charAt(0).toUpperCase() + unit.slice(1),
}));

const DEFAULT_DELAY = "1 day";

/** ISO timestamp one day from now, used when switching to the "until" mode. */
function defaultUntil(): string {
  return new Date(Date.now() + DAY_MS).toISOString();
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Reads a persisted delay back into an editable amount and unit, reusing the
 * canonical duration parser so any accepted shape (`"1d"`, `"2 days"`, a
 * number of milliseconds, `{ days: 1 }`) round-trips.
 */
function readDelay(value: unknown): { amount: string; unit: string } {
  const ms = parseDurationValue(value);
  if (ms === null || ms <= 0) {
    return { amount: "", unit: "days" };
  }

  for (const unit of Object.keys(UNIT_MS)) {
    const size = UNIT_MS[unit];
    if (ms % size === 0) {
      return { amount: String(ms / size), unit };
    }
  }

  return { amount: String(Math.round(ms / UNIT_MS.minutes)), unit: "minutes" };
}

/** Builds the `"<amount> <unit>"` string the engine parses, defaulting to 1. */
function formatDelay(amount: string, unit: string): string {
  const value = amount.trim() === "" ? "1" : amount.trim();
  const label = value === "1" ? unit.replace(/s$/, "") : unit;
  return `${value} ${label}`;
}

/** Parses a persisted ISO timestamp into the day and `"HH:mm"` the pickers use. */
function readUntil(value: unknown): { date: Date | undefined; time: string } {
  const raw = stringValue(value).trim();
  if (!raw) {
    return { date: undefined, time: "" };
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return { date: undefined, time: "" };
  }

  return { date, time: format(date, TIME_PICKER_FORMAT) };
}

/** Combines a day and an `"HH:mm"` time into an absolute ISO timestamp, or null. */
function buildUntil(date: Date, time: string): string | null {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return setSeconds(setMinutes(setHours(date, hours), minutes), 0).toISOString();
}

/**
 * Configuration panel for the Wait action. The step either waits a relative
 * duration ("delay") or sleeps until an absolute date and time ("until"). In
 * delay mode an optional time of day anchors the resume to a wall-clock time
 * in the site time zone ("2 days at 09:00"), and the delay itself can be
 * written as a template expression. Only the field for the selected mode is
 * persisted, so a stale value can never take precedence in the engine.
 */
export function WaitConfigPanel({ data, onChange }: NodeConfigPanelProps) {
  const mode: WaitMode = data.waitMode === "until" ? "until" : "delay";
  const delayMode: WaitDelayMode =
    data.delayMode === "expression" ? "expression" : "value";
  const { amount, unit } = readDelay(data.delay);
  const timeOfDay = stringValue(data.timeOfDay);
  const until = readUntil(data.until);

  const availableUnits = timeOfDay
    ? DELAY_UNITS.filter((option) => ANCHORED_UNITS.has(option.value))
    : DELAY_UNITS;
  const safeUnit = availableUnits.some((option) => option.value === unit)
    ? unit
    : "days";

  /// The persisted delay-mode config, so the field grouping lives in one place.
  const setDelayConfig = (next: {
    delay: string;
    timeOfDay: string | null;
    delayMode?: WaitDelayMode;
  }) =>
    onChange({
      waitMode: "delay",
      delay: next.delay,
      timeOfDay: next.timeOfDay,
      delayMode: next.delayMode ?? "value",
      until: null,
    });

  const setMode = (next: WaitMode) => {
    if (next === mode) {
      return;
    }

    onChange(
      next === "until"
        ? {
            waitMode: "until",
            delay: null,
            timeOfDay: null,
            delayMode: "value",
            until: stringValue(data.until) || defaultUntil(),
          }
        : {
            waitMode: "delay",
            until: null,
            timeOfDay: null,
            delayMode: "value",
            delay: stringValue(data.delay) || DEFAULT_DELAY,
          },
    );
  };

  const setTimeOfDay = (next: string) => {
    if (!next) {
      setDelayConfig({ delay: stringValue(data.delay), timeOfDay: null });
      return;
    }

    // Anchoring requires a whole number of days: collapse a sub-day delay
    // (e.g. "36 hours") up to the next whole day so a time of day is
    // meaningful. Expressions are left untouched (resolved at run time).
    if (delayMode === "value" && !ANCHORED_UNITS.has(safeUnit)) {
      const ms = parseDurationValue(data.delay) ?? 0;
      const days = Math.max(1, Math.ceil(ms / DAY_MS));
      setDelayConfig({ delay: formatDelay(String(days), "days"), timeOfDay: next });
      return;
    }

    setDelayConfig({ delay: stringValue(data.delay), timeOfDay: next });
  };

  /// Rebuilds the absolute resume timestamp from the date and time pickers.
  const setUntil = (date: Date, time: string) => {
    const next = buildUntil(date, time);
    if (!next) {
      return;
    }

    onChange({
      waitMode: "until",
      until: next,
      delay: null,
      timeOfDay: null,
      delayMode: "value",
    });
  };

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="wait-mode">Wait for</FieldLabel>
        <Select
          value={mode}
          onValueChange={(value) => setMode(value as WaitMode)}
        >
          <SelectTrigger id="wait-mode" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="delay">A delay</SelectItem>
            <SelectItem value="until">Until a date and time</SelectItem>
          </SelectContent>
        </Select>
        <FieldDescription>
          The run sleeps as data and resumes on its own; restarts do not lose it.
        </FieldDescription>
      </Field>

      {mode === "delay" ? (
        <>
          <Field>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel htmlFor="wait-amount">Delay</FieldLabel>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                Expression
                <Switch
                  checked={delayMode === "expression"}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      const parsed = parseDurationValue(data.delay);
                      setDelayConfig({
                        delay:
                          parsed === null
                            ? DEFAULT_DELAY
                            : stringValue(data.delay),
                        timeOfDay: timeOfDay || null,
                        delayMode: "value",
                      });
                      return;
                    }
                    setDelayConfig({
                      delay: stringValue(data.delay) || DEFAULT_DELAY,
                      timeOfDay: timeOfDay || null,
                      delayMode: "expression",
                    });
                  }}
                />
              </span>
            </div>
            {delayMode === "expression" ? (
              <Input
                id="wait-amount"
                value={stringValue(data.delay)}
                onChange={(event) =>
                  setDelayConfig({
                    delay: event.target.value,
                    timeOfDay: timeOfDay || null,
                    delayMode: "expression",
                  })
                }
                placeholder="{{ payload.days }} days"
              />
            ) : (
              <div className="flex gap-2">
                <Input
                  id="wait-amount"
                  type="number"
                  min={0}
                  step="any"
                  className="flex-1"
                  value={amount}
                  onChange={(event) =>
                    setDelayConfig({
                      delay: formatDelay(event.target.value, safeUnit),
                      timeOfDay: timeOfDay || null,
                    })
                  }
                  placeholder="1"
                />
                <Select
                  value={safeUnit}
                  onValueChange={(value) =>
                    setDelayConfig({
                      delay: formatDelay(amount, value),
                      timeOfDay: timeOfDay || null,
                    })
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <FieldDescription>
              How long to pause before continuing (e.g.{" "}
              <span className="font-medium">3 days</span>). Turn on Expression to
              use {"{{ ... }}"} from the payload and previous steps.
            </FieldDescription>
          </Field>
          <Field>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel htmlFor="wait-time-of-day">
                Time of day (optional)
              </FieldLabel>
              {timeOfDay && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs text-muted-foreground"
                  onClick={() => setTimeOfDay("")}
                >
                  Clear
                </Button>
              )}
            </div>
            <TimePicker
              value={timeOfDay}
              onValueChange={setTimeOfDay}
              options={TIME_OPTIONS}
            />
            <FieldDescription>
              Resume at this time in the site time zone (e.g.{" "}
              <span className="font-medium">2 days at 09:00</span>). Requires a
              whole number of days; leave empty to resume exactly after the
              delay.
            </FieldDescription>
          </Field>
        </>
      ) : (
        <>
          <Field>
            <FieldLabel>Date</FieldLabel>
            <Calendar
              mode="single"
              selected={until.date}
              onSelect={(next) => {
                if (next) {
                  setUntil(next, until.time || "09:00");
                }
              }}
              className="mx-auto [--cell-size:2rem]"
            />
          </Field>

          <Field>
            <FieldLabel>Time</FieldLabel>
            <TimePicker
              value={until.time}
              onValueChange={(next) => {
                if (until.date) {
                  setUntil(until.date, next);
                }
              }}
              options={TIME_OPTIONS}
            />
          </Field>

          <FieldDescription>
            The flow resumes at this local date and time. If it is already in the
            past, the flow continues immediately.
          </FieldDescription>
        </>
      )}
    </FieldGroup>
  );
}
