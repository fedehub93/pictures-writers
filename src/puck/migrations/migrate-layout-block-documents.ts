import "server-only";

import { db } from "@/shared/lib/db";

import {
  migrateLayoutBlocks,
  type LayoutBlockMigrationChange,
  type LayoutBlockMigrationWarning,
} from "./migrate-layout-blocks";

/** The two tables that store Puck documents. */
export type LayoutBlockMigrationTable = "page" | "siteRegion";

export interface LayoutBlockMigrationEntry {
  table: LayoutBlockMigrationTable;
  versionId: string;
  /** Page slug, or the Site region key. */
  label: string;
  version: number;
  changes: LayoutBlockMigrationChange[];
  warnings: LayoutBlockMigrationWarning[];
}

export interface LayoutBlockMigrationFailure {
  table: LayoutBlockMigrationTable;
  versionId: string;
  /** Page slug, or the Site region key. */
  label: string;
  version: number;
  reason: string;
}

export interface LayoutBlockMigrationReport {
  scanned: number;
  /** Documents written, or that would be written in a dry run. */
  changed: number;
  unchanged: number;
  skipped: number;
  failed: LayoutBlockMigrationFailure[];
  /**
   * Documents that were changed, or that need attention because of warnings.
   */
  documents: LayoutBlockMigrationEntry[];
  dryRun: boolean;
}

export interface LayoutBlockMigrationOptions {
  dryRun?: boolean;
  onProgress?: (line: string) => void;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function describeChanges(changes: LayoutBlockMigrationChange[]): string {
  return changes
    .map((change) => {
      const component = `${change.componentType}${change.componentId ? `#${change.componentId}` : ""}`;

      return `${component} -> Container, display ${change.display}`;
    })
    .join("; ");
}

interface MigrationRow {
  table: LayoutBlockMigrationTable;
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
  report: LayoutBlockMigrationReport,
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
    const result = migrateLayoutBlocks(row.puckData);
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
 * Rewrite every stored Flex and Grid node to a Container.
 *
 * This is a developer tool, not a request-path migration: it runs once, before
 * the deploy that deletes the two block types, while the current code still
 * renders a Container correctly. It scans every Page version and every Site
 * region version — drafts, current, live and history alike — so no version
 * restored from history can surface a retired type after the deploy. It reports
 * each changed version with the nodes it touched, never writes in dry-run mode,
 * and keeps going when one document cannot be migrated.
 *
 * Running it twice is harmless because the pure transform is idempotent; the
 * second run reports no changes.
 */
export async function migrateLayoutBlockDocuments({
  dryRun = false,
  onProgress,
}: LayoutBlockMigrationOptions = {}): Promise<LayoutBlockMigrationReport> {
  const report: LayoutBlockMigrationReport = {
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
