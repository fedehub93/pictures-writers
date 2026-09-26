"use client";

import { createElement } from "react";

import { getNodeIcon } from "./node-icons";

/**
 * Stable wrapper that renders the icon for a node type. Resolving the icon
 * here (rather than assigning a component to a variable during render) keeps
 * the React Compiler happy.
 */
export function NodeIcon({
  type,
  className,
}: {
  type?: string | null;
  className?: string;
}) {
  return createElement(getNodeIcon(type), { className });
}
