import type { WidgetGroupId } from "./types";

/**
 * The ordered vocabulary of Widget groups. The widget library renders these in
 * array order (a curated order), shows only the groups holding at least one
 * permitted definition, and hides any left without a search match.
 */
export interface WidgetGroupMeta {
  id: WidgetGroupId;
  label: string;
  /** Accent color for the group dot, active state, and fallback tile. */
  color: string;
}

export const WIDGET_GROUPS: WidgetGroupMeta[] = [
  { id: "content", label: "Content", color: "#6366f1" },
  { id: "shop", label: "Shop", color: "#10b981" },
  { id: "automations", label: "Automations", color: "#f59e0b" },
  { id: "analytics", label: "Analytics", color: "#0ea5e9" },
];

export const getWidgetGroup = (id: WidgetGroupId) =>
  WIDGET_GROUPS.find((group) => group.id === id);
