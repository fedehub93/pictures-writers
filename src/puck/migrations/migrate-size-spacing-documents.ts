import "server-only";

import { db } from "@/shared/lib/db";

import {
  migrateSizeSpacing,
  type SizeSpacingMigrationChange,
  type SizeSpacingMigrationWarning,
} from "./migrate-size-spacing";

/** The two tables that store Puck documents. */
export type PuckDocumentMigrationTable = "page" | "siteRegion";

export interface PuckDocumentMigrationEntry {
  table: PuckDocumentMigrationTable;
  versionId: string;
  /** Page slug, or the Site region key. */
  label: string;
  version: number;
  changes: SizeSpacingMigrationChange[];
  warnings: SizeSpacingMigrationWarning[];
}

export interface PuckDocumentMigrationFailure {
  table: PuckDocumentMigrationTable;
  versionId: string;
  /** Page slug, or the Site region key. */
  label: string;
  version: number;
  reason: string;
}

export interface PuckDocumentMigrationReport {
  scanned: number;
  /** Documents written, or that would be written in a dry run. */
  changed: number;
  unchanged: number;
  skipped: number;
  failed: PuckDocumentMigrationFailure[];
  /** Documents that were changed, or that need attention because of warnings. */
  documents: PuckDocumentMigrationEntry[];
  dryRun: boolean;
}

export interface PuckDocumentMigrationOptions {
  dryRun?: boolean;
  onProgress?: (line: string) => void;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function describeChanges(changes: SizeSpacingMigrationChange[]): string {
  return changes
    .map((change) => {
      const component = `${change.componentType}${change.componentId ? `#${change.componentId}` : ""}`;
      const moved: string[] = [];
      if (change.size.length > 0) moved.push(`size ${change.size.join(", ")}`);
      if (change.spacing.length > 0) {
        moved.push(`spacing ${change.spacing.join(", ")}`);
      }

      return `${component}: ${moved.length > 0 ? moved.join("; ") : "dimension removed"}`;
    })
    .join("; ");
}

interface MigrationRow {
  table: PuckDocumentMigrationTable;
  versionId: string;
  label: string;
  version: number;
  puckData: PrismaJson.PuckData | null;
  write: (data: PrismaJson.PuckData) => Promise<unknown>;
}

/**
 * Migrate one stored version and fold the outcome into the report.
 *
 * A row that cannot be migrated or written is recorded as a failure and the run
 * continues, so one bad document cannot abort the rest of the backfill.
 */
async function migrateRow(
  row: MigrationRow,
  report: PuckDocumentMigrationReport,
  dryRun: boolean,
  onProgress?: (line: string) => void,
): Promise<void> {
  report.scanned += 1;

  if (row.puckData == null) {
    report.skipped += 1;

    return;
  }

  const where = `${row.table} ${row.label} v${row.version}`;

  try {
    const result = migrateSizeSpacing(row.puckData);
    const hasWork = result.changes.length > 0;

    if (hasWork) {
      if (!dryRun) await row.write(result.data);
      report.changed += 1;
      onProgress?.(
        `${dryRun ? "would migrate" : "migrate"} ${where}: ${describeChanges(result.changes)}`,
      );
    } else {
      report.unchanged += 1;
    }

    if (hasWork || result.warnings.length > 0) {
      report.documents.push({
        table: row.table,
        versionId: row.versionId,
        label: row.label,
        version: row.version,
        changes: result.changes,
        warnings: result.warnings,
      });
    }

    for (const warning of result.warnings) {
      onProgress?.(
        `warn ${where}: ${warning.componentType}${warning.componentId ? `#${warning.componentId}` : ""} — ${warning.reason}`,
      );
    }
  } catch (error) {
    const reason = describeError(error);
    report.failed.push({
      table: row.table,
      versionId: row.versionId,
      label: row.label,
      version: row.version,
      reason,
    });
    onProgress?.(`fail ${where}: ${reason}`);
  }
}

/**
 * Backfill every stored Puck document to the split `size` and `spacing` shape.
 *
 * This is a developer tool, not a request-path migration: it exists only for
 * documents saved before the single `dimension` prop was split in two. It scans
 * every Page version and every Site region version — drafts, live and history
 * alike — so the database holds one shape and a version restored from history
 * cannot surface the old one. It reports each changed version, never writes in
 * dry-run mode, and keeps going when one document cannot be migrated.
 *
 * Running it twice is harmless because the pure transform is idempotent; the
 * second run reports no changes.
 */
export async function migrateSizeSpacingDocuments({
  dryRun = false,
  onProgress,
}: PuckDocumentMigrationOptions = {}): Promise<PuckDocumentMigrationReport> {
  const report: PuckDocumentMigrationReport = {
    scanned: 0,
    changed: 0,
    unchanged: 0,
    skipped: 0,
    failed: [],
    documents: [],
    dryRun,
  };

  const pages = await db.pageVersion.findMany({
    select: {
      id: true,
      version: true,
      puckData: true,
      root: { select: { slug: true } },
    },
    orderBy: [{ rootId: "asc" }, { version: "asc" }],
  });

  for (const stored of pages) {
    await migrateRow(
      {
        table: "page",
        versionId: stored.id,
        label: stored.root.slug,
        version: stored.version,
        puckData: stored.puckData,
        write: (puckData) =>
          db.pageVersion.update({ where: { id: stored.id }, data: { puckData } }),
      },
      report,
      dryRun,
      onProgress,
    );
  }

  const regions = await db.siteRegionVersion.findMany({
    select: {
      id: true,
      version: true,
      puckData: true,
      root: { select: { key: true } },
    },
    orderBy: [{ rootId: "asc" }, { version: "asc" }],
  });

  for (const stored of regions) {
    await migrateRow(
      {
        table: "siteRegion",
        versionId: stored.id,
        label: stored.root.key,
        version: stored.version,
        puckData: stored.puckData,
        write: (puckData) =>
          db.siteRegionVersion.update({
            where: { id: stored.id },
            data: { puckData },
          }),
      },
      report,
      dryRun,
      onProgress,
    );
  }

  return report;
}
