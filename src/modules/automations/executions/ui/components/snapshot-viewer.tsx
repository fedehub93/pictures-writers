"use client";

import { Badge } from "@/shared/ui/badge";

import {
  formatSnapshotForDisplay,
  isTruncatedSnapshot,
} from "../../../lib/run-ledger";

interface SnapshotViewerProps {
  label: string;
  value: unknown;
}

export const SnapshotViewer = ({ label, value }: SnapshotViewerProps) => {
  const truncated = isTruncatedSnapshot(value);
  const text = formatSnapshotForDisplay(value);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        {truncated && <Badge variant="outline">Truncated by engine</Badge>}
      </div>
      {text ? (
        <pre className="max-h-80 overflow-auto rounded-md border bg-muted/50 p-3 text-xs whitespace-pre-wrap break-words">
          {text}
        </pre>
      ) : (
        <p className="text-xs text-muted-foreground">No snapshot.</p>
      )}
    </div>
  );
};
