"use client";

import { SaveStatusIndicator } from "@/shared/components/save-status-indicator";

import { usePostStore } from "../../../store/use-post-store";

export function PostStatusIndicator() {
  const status = usePostStore((state) => state.status);

  return <SaveStatusIndicator status={status} className="flex-1" />;
}
