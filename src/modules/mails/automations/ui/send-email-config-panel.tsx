"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { NodeConfigPanelProps } from "@/modules/automations/editor/config/node-config-panel-types";
import { useTRPC } from "@/trpc/client";
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
import { Textarea } from "@/shared/ui/textarea";

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Configuration panel for the Send Email action, contributed by the mails
 * module. The body is either authored inline or reused from a saved
 * `EmailTemplate`; all fields support `{{ ... }}` template expressions resolved
 * from the run payload and predecessor outputs.
 */
export function SendEmailConfigPanel({ data, onChange }: NodeConfigPanelProps) {
  const trpc = useTRPC();
  const { data: templates, isLoading: isLoadingTemplates } = useQuery(
    trpc.templates.getMany.queryOptions(),
  );

  const emailTemplateId = stringValue(data.emailTemplateId);
  const bodySource = emailTemplateId ? "template" : "custom";
  const previewText = stringValue(data.previewText);
  const previewTextLength = previewText.trim().length;

  const templateOptions = useMemo(
    () => templates?.map((template) => ({ label: template.name, value: template.id })) ?? [],
    [templates],
  );

  const handleSourceChange = (value: string) => {
    if (value === "template") {
      onChange({ emailTemplateId: templateOptions[0]?.value ?? "" });
      return;
    }

    onChange({ emailTemplateId: "" });
  };

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
        <FieldLabel htmlFor="send-email-preview-text">
          Preview text (optional)
        </FieldLabel>
        <Input
          id="send-email-preview-text"
          value={previewText}
          onChange={(event) => onChange({ previewText: event.target.value })}
          placeholder="Unlock your onboarding"
        />
        <FieldDescription>
          Shown after the subject in the inbox. {"{{ ... }}"} expressions are
          resolved before sending.
          {previewTextLength > 100
            ? ` ${previewTextLength} characters — most inboxes show about 100.`
            : ""}
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="send-email-body-source">Body source</FieldLabel>
        <Select value={bodySource} onValueChange={handleSourceChange}>
          <SelectTrigger id="send-email-body-source" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Custom HTML</SelectItem>
            <SelectItem
              value="template"
              disabled={isLoadingTemplates || templateOptions.length === 0}
            >
              Email template
            </SelectItem>
          </SelectContent>
        </Select>
        <FieldDescription>
          Author the HTML inline, or reuse a saved email template.
        </FieldDescription>
      </Field>

      {bodySource === "template" ? (
        <Field>
          <FieldLabel htmlFor="send-email-template">Template</FieldLabel>
          <Select
            value={emailTemplateId}
            onValueChange={(value) => onChange({ emailTemplateId: value })}
            disabled={isLoadingTemplates}
          >
            <SelectTrigger id="send-email-template" className="w-full">
              <SelectValue
                placeholder={
                  isLoadingTemplates ? "Loading templates..." : "Select a template"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {templateOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>
            The template&apos;s HTML is sent as the body. {"{{ ... }}"} expressions
            are resolved from the run payload before sending.
          </FieldDescription>
        </Field>
      ) : (
        <Field>
          <FieldLabel htmlFor="send-email-body">Body HTML</FieldLabel>
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
      )}

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
