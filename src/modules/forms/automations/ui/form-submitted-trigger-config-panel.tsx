"use client";

import { useQuery } from "@tanstack/react-query";

import type { NodeConfigPanelProps } from "@/modules/automations/editor/config/node-config-panel-types";
import { MAX_PAGE_SIZE } from "@/modules/forms/constants";
import { useTRPC } from "@/trpc/client";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Configuration panel for the `form.submitted` trigger, contributed by the
 * forms module. The trigger is scoped to exactly one form: the flow only starts
 * for submissions of the selected form. Publishing without a selection is
 * rejected by {@link formSubmittedNodeValidator}.
 */
export function FormSubmittedTriggerConfigPanel({
  data,
  onChange,
}: NodeConfigPanelProps) {
  const trpc = useTRPC();
  const { data: forms, isLoading } = useQuery(
    trpc.forms.getMany.queryOptions({ pageSize: MAX_PAGE_SIZE }),
  );

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="form-submitted-trigger-form">Form</FieldLabel>
        <Select
          value={stringValue(data.formId)}
          onValueChange={(value) => onChange({ formId: value })}
          disabled={isLoading}
        >
          <SelectTrigger id="form-submitted-trigger-form" className="w-full">
            <SelectValue
              placeholder={isLoading ? "Loading forms..." : "Select a form"}
            />
          </SelectTrigger>
          <SelectContent>
            {(forms?.items ?? []).map((form) => (
              <SelectItem key={form.id} value={form.id}>
                {form.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>
          The flow starts only when this form is submitted. The responder&apos;s
          address is available as {"{{ payload.email }}"} and the answers under{" "}
          {"{{ payload.data }}"}.
        </FieldDescription>
      </Field>
    </FieldGroup>
  );
}
