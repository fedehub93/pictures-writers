export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

/// Canvas placeholder node; picking a trigger from its selector converts it.
export const INITIAL_NODE_TYPE = "INITIAL";

/// Node types that start a workflow ("triggers" per CONTEXT.md). Publish
/// requires at least one of these.
export const TRIGGER_NODE_TYPES = ["MANUAL_TRIGGER"] as const;