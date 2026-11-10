"use client";

import "client-only";

import {
  editorRootSettingsLabel,
  getEditorRootBreadcrumb,
} from "../../lib/editor-root-entry";

export type EditorRootEntryProps = {
  rootLabel: string;
  selectedLabel?: string | null;
  isActive: boolean;
  onSelectRoot: () => void;
};

const BREADCRUMB_SEPARATOR = (
  <span aria-hidden className="text-muted-foreground">
    ›
  </span>
);

/**
 * Entry point to the Editor root above the properties panel: the settings
 * heading while the root is active, otherwise the document › block breadcrumb.
 * Purely presentational: the caller owns the Puck selection.
 */
export const EditorRootEntry = ({
  rootLabel,
  selectedLabel = null,
  isActive,
  onSelectRoot,
}: EditorRootEntryProps) => {
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
