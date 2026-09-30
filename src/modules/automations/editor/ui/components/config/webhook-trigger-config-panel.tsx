"use client";

import { CopyIcon, KeyRoundIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { NodeConfigPanelProps } from "@/modules/automations/editor/config/node-config-panel-types";
import {
  useClearWebhookSecret,
  useSetWebhookSecret,
} from "@/modules/automations/hooks/use-automations";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

function generateSecret(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Configuration panel for the Webhook trigger. The secret is never stored on
 * the node: it is sent to the server once and kept as a hash on the Automation.
 */
export function WebhookTriggerConfigPanel({
  automationId,
  hasWebhookSecret,
}: NodeConfigPanelProps) {
  const [secret, setSecret] = useState("");
  const setWebhookSecret = useSetWebhookSecret();
  const clearWebhookSecret = useClearWebhookSecret();

  const endpointPath = `/api/automations/webhook/${automationId}/`;

  const handleCopyEndpoint = async () => {
    const url = `${window.location.origin}${endpointPath}`;
    await navigator.clipboard.writeText(url);
    toast.success("Webhook URL copied");
  };

  const handleSave = () => {
    if (!automationId || secret.trim().length === 0) {
      return;
    }

    setWebhookSecret.mutate(
      { id: automationId, secret: secret.trim() },
      { onSuccess: () => setSecret("") },
    );
  };

  const handleClear = () => {
    if (!automationId) {
      return;
    }

    clearWebhookSecret.mutate({ id: automationId });
  };

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Status</FieldLabel>
        <div>
          <Badge variant={hasWebhookSecret ? "secondary" : "outline"}>
            {hasWebhookSecret ? "Secret configured" : "No secret yet"}
          </Badge>
        </div>
        <FieldDescription>
          The endpoint accepts a POST whose body becomes the Run payload.
          Callers must send the secret in the{" "}
          <span className="font-medium">x-automation-secret</span> header.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="webhook-endpoint">Endpoint</FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            id="webhook-endpoint"
            readOnly
            value={endpointPath}
            className="font-mono text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Copy webhook URL"
            onClick={handleCopyEndpoint}
          >
            <CopyIcon data-icon="inline-start" />
          </Button>
        </div>
      </Field>

      <Field>
        <FieldLabel htmlFor="webhook-secret">Secret</FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            id="webhook-secret"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder="Paste or generate a secret"
            autoComplete="off"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Generate a secret"
            onClick={() => setSecret(generateSecret())}
          >
            <KeyRoundIcon data-icon="inline-start" />
          </Button>
        </div>
        <FieldDescription>
          Saving replaces the stored secret immediately; previous callers stop
          working.
        </FieldDescription>
      </Field>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={
            !automationId ||
            secret.trim().length === 0 ||
            setWebhookSecret.isPending
          }
        >
          Save secret
        </Button>
        {hasWebhookSecret ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={clearWebhookSecret.isPending}
          >
            Remove
          </Button>
        ) : null}
      </div>
    </FieldGroup>
  );
}
