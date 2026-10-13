"use client";

import { Settings2 } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import {
  configFieldValue,
  configFieldValues,
  withConfigValue,
  withConfigValues,
} from "../../lib/config";
import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
  WidgetDefinition,
} from "@/shared/dashboard/types";

interface ConfigPopoverProps {
  definition: WidgetDefinition;
  instance: DashboardWidgetInstance;
  /** Resolved context the schema builds its options from. */
  context: WidgetConfigContext;
  /** Receives the full config for this instance after an edit. */
  onChange: (config: Record<string, unknown>) => void;
}

/**
 * The gear a configurable widget shows in edit mode. The popover is generated
 * from the definition's config schema, so a definition becomes configurable
 * without a bespoke control here.
 */
export const ConfigPopover = ({
  definition,
  instance,
  context,
  onChange,
}: ConfigPopoverProps) => {
  const schema = definition.configSchema?.(context);

  if (!schema || schema.fields.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Configure ${definition.title}`}
        >
          <Settings2 />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex flex-col gap-4">
        <p className="text-sm font-medium">Configure {definition.title}</p>
        <FieldGroup className="gap-4">
          {schema.fields.map((field) => {
            const controlId = `widget-${instance.key}-${field.name}`;

            if (field.type === "multiselect") {
              const values = configFieldValues(instance.config, field);

              return (
                <Field key={field.name}>
                  <FieldLabel>{field.label}</FieldLabel>
                  <div className="flex flex-col gap-2">
                    {field.options.map((option) => {
                      const optionId = `${controlId}-${option.value}`;

                      return (
                        <label
                          key={option.value}
                          htmlFor={optionId}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            id={optionId}
                            checked={values.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const next = checked
                                ? [...values, option.value]
                                : values.filter(
                                    (value) => value !== option.value,
                                  );

                              // A field with no selection would show nothing;
                              // keep at least one option chosen.
                              if (next.length === 0) return;

                              onChange(
                                withConfigValues(instance.config, field, next),
                              );
                            }}
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </div>
                </Field>
              );
            }

            return (
              <Field key={field.name}>
                <FieldLabel htmlFor={controlId}>{field.label}</FieldLabel>
                <Select
                  value={configFieldValue(instance.config, field)}
                  onValueChange={(value) =>
                    onChange(withConfigValue(instance.config, field, value))
                  }
                >
                  <SelectTrigger id={controlId} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {field.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            );
          })}
        </FieldGroup>
      </PopoverContent>
    </Popover>
  );
};
