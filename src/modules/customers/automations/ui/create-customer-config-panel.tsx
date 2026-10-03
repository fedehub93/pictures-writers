"use client";

import type { NodeConfigPanelProps } from "@/modules/automations/editor/config/node-config-panel-types";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Configuration panel for the `CREATE_CUSTOMER` action. Every field supports
 * `{{ ... }}` template expressions resolved from the run payload, so a form
 * submission can drive the email, name, phone and notes.
 */
export function CreateCustomerConfigPanel({
  data,
  onChange,
}: NodeConfigPanelProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="create-customer-email">Email</FieldLabel>
        <Input
          id="create-customer-email"
          value={stringValue(data.email)}
          onChange={(event) => onChange({ email: event.target.value })}
          placeholder="{{ payload.email }}"
        />
        <FieldDescription>
          Required. Existing customers are matched by this address and updated.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="create-customer-name">Name</FieldLabel>
        <Input
          id="create-customer-name"
          value={stringValue(data.name)}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder="{{ payload.data.name }}"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="create-customer-phone">Phone</FieldLabel>
        <Input
          id="create-customer-phone"
          value={stringValue(data.phone)}
          onChange={(event) => onChange({ phone: event.target.value })}
          placeholder="{{ payload.data.phone }}"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="create-customer-notes">Notes</FieldLabel>
        <Textarea
          id="create-customer-notes"
          rows={3}
          value={stringValue(data.notes)}
          onChange={(event) => onChange({ notes: event.target.value })}
          placeholder="Internal notes"
        />
      </Field>
    </FieldGroup>
  );
}
