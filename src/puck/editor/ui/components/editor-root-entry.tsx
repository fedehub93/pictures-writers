"use client";

import "client-only";

import { FileTextIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import {
  editorRootSettingsLabel,
  getEditorRootBreadcrumb,
} from "../../lib/editor-root-entry";

export type EditorRootEntryProps = {
  rootLabel: string;
  selectedLabel?: string | null;
  isActive: boolean;
  onSelectRoot: () => void;
  /**
   * `row` is the pinned line above the Outline tree; `header` is the fixed
   * heading above the properties panel.
   */
  variant: "row" | "header";
};

const DOCUMENT_ICON = (
  <FileTextIcon aria-hidden className="size-3.5 shrink-0" />
);

const BREADCRUMB_SEPARATOR = (
  <span aria-hidden className="text-muted-foreground">
    ›
  </span>
);

/**
 * Entry point to the Editor root, rendered both in the Outline tab and above the
 * properties panel. Purely presentational: the caller owns the Puck selection.
 */
export const EditorRootEntry = ({
  rootLabel,
  selectedLabel = null,
  isActive,
  onSelectRoot,
  variant,
}: EditorRootEntryProps) => {
  if (variant === "row") {
    return (
      <button
        type="button"
        aria-current={isActive ? "true" : undefined}
        onClick={onSelectRoot}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
          "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive ? "bg-muted font-medium" : "text-foreground/80",
        )}
      >
        {DOCUMENT_ICON}
        <span className="truncate">{rootLabel}</span>
      </button>
    );
  }

  if (isActive) {
    return (
      <div className="flex h-10 shrink-0 items-center border-b px-4">
        <h2 className="text-xs font-semibold">
          {editorRootSettingsLabel(rootLabel)}
        </h2>
      </div>
    );
  }

  const [documentLabel, selectedBlockLabel] = getEditorRootBreadcrumb({
    rootLabel,
    selectedLabel,
  });

  return (
    <div className="flex h-10 shrink-0 items-center gap-1 border-b px-4 text-xs">
      <button
        type="button"
        onClick={onSelectRoot}
        className="rounded-sm truncate hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {documentLabel}
      </button>
      {selectedBlockLabel && (
        <>
          {BREADCRUMB_SEPARATOR}
          <span aria-current="true" className="min-w-0 truncate font-medium">
            {selectedBlockLabel}
          </span>
        </>
      )}
    </div>
  );
};
