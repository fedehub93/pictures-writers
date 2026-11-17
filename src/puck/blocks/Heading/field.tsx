"use client";
import "client-only";

import type { CustomField } from "@puckeditor/core";

import { PanelSelectTrigger } from "@/puck/components/panel-control";
import { PropHeader } from "@/puck/components/prop-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/shared/ui/select";

import {
  HEADING_DEFAULT_LEVEL,
  HEADING_LEVEL_OPTIONS,
  resolveHeadingLevel,
  type HeadingLevel,
} from "./level";

/**
 * The Heading's level, as one panel control.
 *
 * The level is block semantics, not styling, so it is a custom field like the
 * rest of the panel instead of Puck's native select: it carries the same
 * header, the same compact box and a reset that clears the authored value, so
 * the render falls back to the default heading. A stored value outside the
 * allow-list shows the default the render would emit.
 */
export const HeadingLevelField: CustomField<HeadingLevel | undefined> = {
  type: "custom",
  render: ({ name, value, onChange }) => {
    const isModified = value !== undefined && value !== HEADING_DEFAULT_LEVEL;
    const displayValue = resolveHeadingLevel(value);

    return (
      <div className="flex flex-col gap-y-1 p-1">
        <PropHeader
          name={name}
          label="Level"
          isModified={isModified}
          onReset={() => onChange(undefined)}
        />
        <Select
          value={displayValue}
          onValueChange={(next) => onChange(next as HeadingLevel)}
        >
          <PanelSelectTrigger id={name} className="w-full">
            <SelectValue />
          </PanelSelectTrigger>
          <SelectContent>
            {HEADING_LEVEL_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  },
};
