/**
 * Contract every per-node configuration panel implements. A module contributes
 * a panel (e.g. the mails module contributes `SendEmailConfigPanel`) and the
 * editor renders it for the matching node type.
 */
export interface NodeConfigPanelProps {
  /** The node's persisted `data` payload. */
  data: Record<string, unknown>;
  /** Merge a partial update into the node's `data`. */
  onChange: (patch: Record<string, unknown>) => void;
  /** The Automation being edited; needed by panels that touch Automation state. */
  automationId?: string;
  /** Whether the Automation has a webhook secret configured. */
  hasWebhookSecret?: boolean;
}
