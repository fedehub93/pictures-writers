"use client";

import { createElement, type ComponentType } from "react";

import { FormSubmittedTriggerConfigPanel } from "@/modules/forms/automations/ui/form-submitted-trigger-config-panel";
import { SendEmailConfigPanel } from "@/modules/mails/automations/ui/send-email-config-panel";

import { CronTriggerConfigPanel } from "../ui/components/config/cron-trigger-config-panel";
import { HttpRequestConfigPanel } from "../ui/components/config/http-request-config-panel";
import { LlmConfigPanel } from "../ui/components/config/llm-config-panel";
import { WebSearchConfigPanel } from "../ui/components/config/web-search-config-panel";
import { WebhookTriggerConfigPanel } from "../ui/components/config/webhook-trigger-config-panel";
import type { NodeConfigPanelProps } from "./node-config-panel-types";

/**
 * Map of node type → configuration panel. Nodes contributed by a feature
 * module register their panel here (the mails module owns Send Email), keeping
 * the engine core unaware of domain nodes.
 */
export const nodeConfigPanels: Record<
  string,
  ComponentType<NodeConfigPanelProps>
> = {
  CRON_TRIGGER: CronTriggerConfigPanel,
  WEBHOOK_TRIGGER: WebhookTriggerConfigPanel,
  FORM_SUBMITTED_TRIGGER: FormSubmittedTriggerConfigPanel,
  HTTP_REQUEST: HttpRequestConfigPanel,
  WEB_SEARCH: WebSearchConfigPanel,
  LLM: LlmConfigPanel,
  SEND_EMAIL: SendEmailConfigPanel,
};

export function getNodeConfigPanel(
  type: string | null | undefined,
): ComponentType<NodeConfigPanelProps> | undefined {
  return type ? nodeConfigPanels[type] : undefined;
}

/**
 * Renders the configuration panel registered for `type`, or nothing. Using a
 * stable host (with `createElement`) avoids creating components during render.
 */
export function NodeConfigPanelHost({
  type,
  data,
  onChange,
  automationId,
  hasWebhookSecret,
}: NodeConfigPanelProps & { type?: string | null }) {
  const panel = getNodeConfigPanel(type);

  if (!panel) {
    return null;
  }

  return createElement(panel, {
    data,
    onChange,
    automationId,
    hasWebhookSecret,
  });
}
