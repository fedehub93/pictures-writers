"use client";

import type { NodeConfigPanelProps } from "@/modules/automations/editor/config/node-config-panel-types";
import { LLM_PROVIDERS } from "@/modules/automations/lib/actions/llm";
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

function numberText(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : "";
}

/**
 * Configuration panel for the LLM action. Provider, model and prompt all
 * support `{{ ... }}` template expressions; the API key comes from the
 * referenced Credential.
 */
export function LlmConfigPanel({ data, onChange }: NodeConfigPanelProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="llm-provider">Provider</FieldLabel>
        <Select
          value={stringValue(data.provider) || "openai"}
          onValueChange={(value) => onChange({ provider: value })}
        >
          <SelectTrigger id="llm-provider" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LLM_PROVIDERS.map((provider) => (
              <SelectItem key={provider} value={provider}>
                OpenAI (compatible)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor="llm-model">Model</FieldLabel>
        <Input
          id="llm-model"
          value={stringValue(data.model)}
          onChange={(event) => onChange({ model: event.target.value })}
          placeholder="gpt-4o-mini"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="llm-system">System prompt (optional)</FieldLabel>
        <Textarea
          id="llm-system"
          rows={3}
          value={stringValue(data.system)}
          onChange={(event) => onChange({ system: event.target.value })}
          placeholder="You are a helpful editor."
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="llm-prompt">Prompt</FieldLabel>
        <Textarea
          id="llm-prompt"
          rows={6}
          value={stringValue(data.prompt)}
          onChange={(event) => onChange({ prompt: event.target.value })}
          placeholder="Summarise these results: {{ input.results }}"
        />
        <FieldDescription>
          Supports {"{{ ... }}"} expressions from the run payload and previous
          steps.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="llm-temperature">
          Temperature (optional)
        </FieldLabel>
        <Input
          id="llm-temperature"
          type="number"
          min={0}
          max={2}
          step={0.1}
          value={numberText(data.temperature)}
          onChange={(event) =>
            onChange({
              temperature:
                event.target.value === "" ? "" : Number(event.target.value),
            })
          }
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="llm-base-url">Base URL (optional)</FieldLabel>
        <Input
          id="llm-base-url"
          value={stringValue(data.baseUrl)}
          onChange={(event) => onChange({ baseUrl: event.target.value })}
          placeholder="https://api.openai.com/v1"
        />
        <FieldDescription>
          Override for OpenAI-compatible gateways (Groq, OpenRouter, Ollama).
        </FieldDescription>
      </Field>

      <CredentialPicker
        id="llm-credential"
        value={stringValue(data.credentialId)}
        onChange={(value) => onChange({ credentialId: value })}
        description="The provider API key, stored encrypted at rest."
      />
    </FieldGroup>
  );
}
