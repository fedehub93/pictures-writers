"use client";

import { createElement, type ComponentType } from "react";

import { SendEmailConfigPanel } from "@/modules/mails/automations/ui/send-email-config-panel";

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
}: NodeConfigPanelProps & { type?: string | null }) {
  const panel = getNodeConfigPanel(type);

  if (!panel) {
    return null;
  }

  return createElement(panel, { data, onChange });
}
