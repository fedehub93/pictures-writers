import "server-only";

import type { SiteRegionKey } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

import {
  migrateSiteRegionPuckData,
  type PuckDataMigrationChange,
  type PuckDataMigrationWarning,
} from "../lib/migrate-puck-data";

export interface SiteRegionDocumentMigrationEntry {
  versionId: string;
  regionKey: SiteRegionKey;
  version: number;
  changes: PuckDataMigrationChange[];
  warnings: PuckDataMigrationWarning[];
}

export interface SiteRegionDocumentMigrationFailure {
  versionId: string;
  regionKey: SiteRegionKey;
  version: number;
  reason: string;
}

export interface SiteRegionDocumentMigrationReport {
  scanned: number;
  /** Documents written, or that would be written in a dry run. */
  changed: number;
  unchanged: number;
  skipped: number;
  failed: SiteRegionDocumentMigrationFailure[];
  /** Documents that were changed, or that need attention because of warnings. */
  documents: SiteRegionDocumentMigrationEntry[];
  dryRun: boolean;
}

export interface SiteRegionDocumentMigrationOptions {
  dryRun?: boolean;
  onProgress?: (line: string) => void;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function describeChanges(changes: PuckDataMigrationChange[]): string {
  return changes
    .map(
      (change) =>
        `${change.componentType}${change.componentId ? `#${change.componentId}` : ""}: ${change.fields.join(", ")}`,
    )
    .join("; ");
}

/**
 * Backfill every stored Site region version to the nested block content shapes.
 *
 * This is a developer tool, not a request-path migration: it exists only for
 * development documents saved before the Header and Footer blocks grouped their
 * props under `content`. It reports each changed version, never writes in
 * dry-run mode, and keeps going when one document cannot be migrated.
 *
 * Running it twice is harmless because the pure transform is idempotent; the
 * second run reports no changes.
 */
export async function migrateSiteRegionDocuments({
  dryRun = false,
  onProgress,
}: SiteRegionDocumentMigrationOptions = {}): Promise<SiteRegionDocumentMigrationReport> {
  const report: SiteRegionDocumentMigrationReport = {
    scanned: 0,
    changed: 0,
    unchanged: 0,
    skipped: 0,
    failed: [],
    documents: [],
    dryRun,
  };

  const versions = await db.siteRegionVersion.findMany({
    select: {
      id: true,
      version: true,
      puckData: true,
      root: { select: { key: true } },
    },
    orderBy: [{ rootId: "asc" }, { version: "asc" }],
  });

  for (const stored of versions) {
    report.scanned += 1;
    const regionKey = stored.root.key;

    if (stored.puckData == null) {
      report.skipped += 1;
      continue;
    }

    try {
      const result = migrateSiteRegionPuckData(stored.puckData);
      const hasWork = result.changes.length > 0;

      if (hasWork) {
        if (!dryRun) {
          await db.siteRegionVersion.update({
            where: { id: stored.id },
            data: { puckData: result.data },
          });
        }

        report.changed += 1;
      } else {
        report.unchanged += 1;
      }

      if (hasWork || result.warnings.length > 0) {
        report.documents.push({
          versionId: stored.id,
          regionKey,
          version: stored.version,
          changes: result.changes,
          warnings: result.warnings,
        });
      }

      if (hasWork) {
        onProgress?.(
          `${dryRun ? "would migrate" : "migrate"} ${regionKey} v${stored.version}: ${describeChanges(result.changes)}`,
        );
      }

      for (const warning of result.warnings) {
        onProgress?.(
          `warn ${regionKey} v${stored.version}: ${warning.componentType}${warning.componentId ? `#${warning.componentId}` : ""} — ${warning.reason}`,
        );
      }
    } catch (error) {
      const reason = describeError(error);
      report.failed.push({
        versionId: stored.id,
        regionKey,
        version: stored.version,
        reason,
      });
      onProgress?.(`fail ${regionKey} v${stored.version}: ${reason}`);
    }
  }

  return report;
}
