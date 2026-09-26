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
 * Configuration panel for the Send Email action, contributed by the mails
 * module. All fields are authored once and support `{{ ... }}` template
 * expressions resolved from the run payload and predecessor outputs.
 */
export function SendEmailConfigPanel({ data, onChange }: NodeConfigPanelProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="send-email-recipient">To</FieldLabel>
        <Input
          id="send-email-recipient"
          value={stringValue(data.recipient)}
          onChange={(event) => onChange({ recipient: event.target.value })}
          placeholder="{{ payload.email }}"
        />
        <FieldDescription>
          Any address, or a template such as {"{{ payload.email }}"} to email
          the responder.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="send-email-subject">Subject</FieldLabel>
        <Input
          id="send-email-subject"
          value={stringValue(data.subject)}
          onChange={(event) => onChange({ subject: event.target.value })}
          placeholder="Welcome, {{ payload.name }}"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="send-email-body">Body</FieldLabel>
        <Textarea
          id="send-email-body"
          rows={8}
          value={stringValue(data.body)}
          onChange={(event) => onChange({ body: event.target.value })}
          placeholder="<p>Hi {{ payload.name }}, welcome!</p>"
        />
        <FieldDescription>
          HTML body. Template expressions are resolved before sending.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="send-email-from">From (optional)</FieldLabel>
        <Input
          id="send-email-from"
          value={stringValue(data.from)}
          onChange={(event) => onChange({ from: event.target.value })}
          placeholder="Defaults to the configured sender"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="send-email-reply-to">Reply to (optional)</FieldLabel>
        <Input
          id="send-email-reply-to"
          value={stringValue(data.replyTo)}
          onChange={(event) => onChange({ replyTo: event.target.value })}
          placeholder="Defaults to the configured reply-to"
        />
      </Field>
    </FieldGroup>
  );
}
