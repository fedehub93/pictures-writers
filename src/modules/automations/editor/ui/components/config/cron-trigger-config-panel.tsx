"use client";

import type { NodeConfigPanelProps } from "@/modules/automations/editor/config/node-config-panel-types";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Configuration panel for the Cron trigger. The interval is authored as a
 * human duration (e.g. `"2 days"`, `"15 minutes"`); an optional time of day
 * (UTC) pins the firing time.
 */
export function CronTriggerConfigPanel({
  data,
  onChange,
}: NodeConfigPanelProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="cron-interval">Interval</FieldLabel>
        <Input
          id="cron-interval"
          value={stringValue(data.interval)}
          onChange={(event) => onChange({ interval: event.target.value })}
          placeholder="e.g. 1 day"
        />
        <FieldDescription>
          How often the flow runs, measured from the most recent run (e.g.
          {" "}
          <span className="font-medium">15 minutes</span>,{" "}
          <span className="font-medium">2 days</span>).
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="cron-time-of-day">Time of day (optional)</FieldLabel>
        <Input
          id="cron-time-of-day"
          type="time"
          value={stringValue(data.timeOfDay)}
          onChange={(event) =>
            onChange({
              timeOfDay: event.target.value === "" ? undefined : event.target.value,
            })
          }
        />
        <FieldDescription>
          Fire at this time (UTC) once the interval has elapsed. Leave empty to
          fire as soon as the interval elapses.
        </FieldDescription>
      </Field>
    </FieldGroup>
  );
}
