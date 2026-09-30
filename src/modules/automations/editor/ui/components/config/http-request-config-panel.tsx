"use client";

import type { NodeConfigPanelProps } from "@/modules/automations/editor/config/node-config-panel-types";
import { HTTP_REQUEST_METHODS } from "@/modules/automations/lib/actions/http-request";
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

import { CredentialPicker } from "./credential-picker";

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function jsonText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return "";
}

/**
 * Configuration panel for the HTTP Request action. Method, URL, headers and
 * body all support `{{ ... }}` template expressions resolved from the run
 * payload and predecessor outputs; the optional Credential is sent as a bearer
 * token.
 */
export function HttpRequestConfigPanel({
  data,
  onChange,
}: NodeConfigPanelProps) {
  const method = (stringValue(data.method) || "GET").toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="http-request-method">Method</FieldLabel>
        <Select
          value={method}
          onValueChange={(value) => onChange({ method: value })}
        >
          <SelectTrigger id="http-request-method" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HTTP_REQUEST_METHODS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor="http-request-url">URL</FieldLabel>
        <Input
          id="http-request-url"
          value={stringValue(data.url)}
          onChange={(event) => onChange({ url: event.target.value })}
          placeholder="https://api.example.com/endpoint"
        />
        <FieldDescription>
          Absolute URL. {"{{ ... }}"} expressions are resolved before the call.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="http-request-headers">
          Headers (JSON, optional)
        </FieldLabel>
        <Textarea
          id="http-request-headers"
          rows={4}
          value={jsonText(data.headers)}
          onChange={(event) => onChange({ headers: event.target.value })}
          placeholder={'{\n  "Accept": "application/json"\n}'}
        />
        <FieldDescription>
          A JSON object of request headers. Values may use {"{{ ... }}"}.
        </FieldDescription>
      </Field>

      {hasBody ? (
        <Field>
          <FieldLabel htmlFor="http-request-body">Body (optional)</FieldLabel>
          <Textarea
            id="http-request-body"
            rows={6}
            value={jsonText(data.body)}
            onChange={(event) => onChange({ body: event.target.value })}
            placeholder={'{\n  "name": "{{ payload.name }}"\n}'}
          />
        </Field>
      ) : null}

      <CredentialPicker
        id="http-request-credential"
        value={stringValue(data.credentialId)}
        onChange={(value) => onChange({ credentialId: value })}
        description="Sent as a bearer token unless the headers already set Authorization."
      />
    </FieldGroup>
  );
}
