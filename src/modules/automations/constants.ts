export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

/// Canvas placeholder node; picking a trigger from its selector converts it.
export const INITIAL_NODE_TYPE = "INITIAL";

/// Node types that start a workflow ("triggers" per CONTEXT.md). Publish
/// requires at least one of these.
export const TRIGGER_NODE_TYPES = ["MANUAL_TRIGGER"] as const;

export const AUTOMATION_BATCH_SIZE = 50;
export const AUTOMATION_LEASE_MS = 5 * 60 * 1000;
export const AUTOMATION_MAX_ATTEMPTS = 3;
export const AUTOMATION_RETRY_DELAY_MS = 5 * 60 * 1000;
export const AUTOMATION_MAX_EXECUTIONS = 500;
export const AUTOMATION_SECRET_HEADER = "x-scheduled-publication-secret";
