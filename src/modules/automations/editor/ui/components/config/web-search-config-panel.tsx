"use client";

import type { NodeConfigPanelProps } from "@/modules/automations/editor/config/node-config-panel-types";
import { WEB_SEARCH_PROVIDERS } from "@/modules/automations/lib/actions/web-search";
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

const PROVIDER_LABELS: Record<string, string> = {
  tavily: "Tavily",
  brave: "Brave Search",
  serper: "Serper (Google)",
};

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberText(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : "";
}

/**
 * Configuration panel for the Web Search action. The provider and query support
 * `{{ ... }}` template expressions; authentication comes from the referenced
 * Credential, never from node configuration.
 */
export function WebSearchConfigPanel({
  data,
  onChange,
}: NodeConfigPanelProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="web-search-provider">Provider</FieldLabel>
        <Select
          value={stringValue(data.provider) || "tavily"}
          onValueChange={(value) => onChange({ provider: value })}
        >
          <SelectTrigger id="web-search-provider" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEB_SEARCH_PROVIDERS.map((provider) => (
              <SelectItem key={provider} value={provider}>
                {PROVIDER_LABELS[provider] ?? provider}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor="web-search-query">Query</FieldLabel>
        <Textarea
          id="web-search-query"
          rows={3}
          value={stringValue(data.query)}
          onChange={(event) => onChange({ query: event.target.value })}
          placeholder="Latest news about {{ payload.topic }}"
        />
        <FieldDescription>
          Supports {"{{ ... }}"} expressions from the run payload and previous
          steps.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="web-search-max-results">
          Max results (optional)
        </FieldLabel>
        <Input
          id="web-search-max-results"
          type="number"
          min={1}
          value={numberText(data.maxResults)}
          onChange={(event) =>
            onChange({
              maxResults:
                event.target.value === "" ? "" : Number(event.target.value),
            })
          }
        />
      </Field>

      <CredentialPicker
        id="web-search-credential"
        value={stringValue(data.credentialId)}
        onChange={(value) => onChange({ credentialId: value })}
        description="The provider API key. Stored encrypted and never exposed to the editor."
      />
    </FieldGroup>
  );
}
