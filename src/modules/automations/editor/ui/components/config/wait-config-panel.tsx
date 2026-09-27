"use client";

import type { NodeConfigPanelProps } from "@/modules/automations/editor/config/node-config-panel-types";
import { parseDurationValue } from "@/modules/automations/lib/duration";
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

type WaitMode = "delay" | "until";

/// Largest unit first: a delay is edited in the biggest whole unit it fits.
const UNIT_MS: Record<string, number> = {
  weeks: 7 * 24 * 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  hours: 60 * 60 * 1000,
  minutes: 60 * 1000,
};

const DELAY_UNITS = Object.keys(UNIT_MS).map((unit) => ({
  value: unit,
  label: unit.charAt(0).toUpperCase() + unit.slice(1),
}));

const DEFAULT_DELAY = "1 day";

/** ISO timestamp one day from now, used when switching to the "until" mode. */
function defaultUntil(): string {
  return new Date(Date.now() + UNIT_MS.days).toISOString();
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

/** Formats an ISO timestamp for a `datetime-local` input in local time. */
function toLocalInputValue(value: unknown): string {
  const raw = stringValue(value).trim();
  if (!raw) {
    return "";
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Converts a `datetime-local` value to an absolute ISO timestamp, or null. */
function fromLocalInputValue(value: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Configuration panel for the Wait action. The step either waits a relative
 * duration ("delay") or sleeps until an absolute date and time ("until"). Only
 * the field for the selected mode is persisted; the other is cleared so a stale
 * value can never take precedence in the engine.
 */
export function WaitConfigPanel({ data, onChange }: NodeConfigPanelProps) {
  const mode: WaitMode = data.waitMode === "until" ? "until" : "delay";
  const { amount, unit } = readDelay(data.delay);

  const setMode = (next: WaitMode) => {
    if (next === mode) {
      return;
    }

    onChange(
      next === "until"
        ? {
            waitMode: "until",
            delay: null,
            until: stringValue(data.until) || defaultUntil(),
          }
        : {
            waitMode: "delay",
            until: null,
            delay: stringValue(data.delay) || DEFAULT_DELAY,
          },
    );
  };

  const setDelay = (nextAmount: string, nextUnit: string) =>
    onChange({
      waitMode: "delay",
      delay: formatDelay(nextAmount, nextUnit),
      until: null,
    });

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
        <Field>
          <FieldLabel htmlFor="wait-amount">Delay</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="wait-amount"
              type="number"
              min={0}
              step="any"
              className="flex-1"
              value={amount}
              onChange={(event) => setDelay(event.target.value, unit)}
              placeholder="1"
            />
            <Select
              value={unit}
              onValueChange={(value) => setDelay(amount, value)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DELAY_UNITS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FieldDescription>
            How long to pause before continuing (e.g.{" "}
            <span className="font-medium">3 days</span>).
          </FieldDescription>
        </Field>
      ) : (
        <Field>
          <FieldLabel htmlFor="wait-until">Resume at</FieldLabel>
          <Input
            id="wait-until"
            type="datetime-local"
            value={toLocalInputValue(data.until)}
            onChange={(event) => {
              const next = fromLocalInputValue(event.target.value);
              if (next) {
                onChange({ waitMode: "until", until: next, delay: null });
              }
            }}
          />
          <FieldDescription>
            The flow resumes at this local date and time. If it is already in the
            past, the flow continues immediately.
          </FieldDescription>
        </Field>
      )}
    </FieldGroup>
  );
}
