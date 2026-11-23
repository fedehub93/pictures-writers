import "server-only";

import type { StoredFileKind } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import {
  buildStoredAddressIndex,
  rewriteAddressesInString,
  rewriteAddressesInValue,
  type AddressRewriteResult,
  type StoredAddressIndex,
  type StoredAddressIndexEntry,
  type StoredAddressTarget,
} from "@/modules/media/lib/address-rewrite";
import type { StoredFileRole } from "@/modules/media/lib/file-path";

/**
 * Every field the product stores an address in. The list is the sweep's
 * contract: a new content field that can hold a file address belongs here, or
 * exactly the kind of address the spec forbids survives a run.
 *
 * `PostVersion.bodyData` is deliberately absent: it is content the renderer
 * never reads (a save only carries it forward) and the column is slated for
 * removal, so a provider address inside it is not a dependency of the product.
 */
export const ADDRESS_SWEEP_FIELDS = [
  "PageVersion.puckData",
  "SiteRegionVersion.puckData",
  "PostVersion.tiptapBodyData",
  "ProductVersion.tiptapDescription",
  "AdItem.imageUrl",
  "Settings.logoUrl",
  "FormSubmission.data",
  "User.image",
  "User.imageUrl",
  "EmailAttachment.url",
] as const;

export type AddressSweepField = (typeof ADDRESS_SWEEP_FIELDS)[number];

export interface AddressSweepFieldReport {
  field: AddressSweepField;
  /** Rows whose stored value would change, or did change. */
  rows: number;
  /** Addresses that become the canonical address of a stored file. */
  rewritten: number;
  /** File addresses no stored file owns, left exactly as they were. */
  unresolved: number;
}

export interface AddressSweepReport {
  dryRun: boolean;
  /** Distinct stored files an address was, or would be, rewritten to. */
  files: number;
  /** Rows that would change, or did change. */
  rows: number;
  /** Addresses that become the canonical address of a stored file. */
  rewritten: number;
  /** File addresses no stored file owns. */
  unresolved: number;
  fields: AddressSweepFieldReport[];
}

export interface AddressSweepOptions {
  dryRun?: boolean;
  /**
   * Addresses a relink gave a target that no Stored file records, keyed by the
   * address content carries. The sweep resolves them exactly like a recorded
   * address, so the relink can reuse one run instead of writing content twice.
   */
  addressOverrides?: ReadonlyMap<string, StoredAddressTarget>;
  /**
   * Receives every address no stored file owns, with the field it appeared in.
   * A caller can then give it a target (the relink) and sweep again; the
   * report itself never carries an address.
   */
  onUnresolvedAddress?: (address: string, field: AddressSweepField) => void;
}

interface FieldTally {
  rows: number;
  rewritten: number;
  unresolved: number;
}

const ROLE_BY_KIND: Record<StoredFileKind, StoredFileRole> = {
  MEDIA: "MEDIA",
  ATTACHMENT: "ATTACHMENT",
  AVATAR: "AVATAR",
};

function roleForKind(kind: StoredFileKind): StoredFileRole {
  return ROLE_BY_KIND[kind];
}

async function readAddressIndex(): Promise<StoredAddressIndex> {
  const files = await db.storedFile.findMany({
    select: {
      id: true,
      key: true,
      driver: true,
      kind: true,
      remoteUrl: true,
      media: {
        select: {
          id: true,
          revision: true,
          archivedAt: true,
          renditions: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  const entries: StoredAddressIndexEntry[] = files.map((file) => ({
    fileId: file.id,
    key: file.key,
    role: roleForKind(file.kind),
    remoteUrl: file.remoteUrl,
    media: file.media
      ? {
          revision: file.media.revision,
          archived: file.media.archivedAt !== null,
          renditions: file.media.renditions,
        }
      : null,
  }));

  return buildStoredAddressIndex(entries);
}

/**
 * Rewrites the addresses in one field of one table. The rewrite function is
 * the only difference between a string column and a JSON document, so the
 * skip test, the tally arithmetic and the dry-run gate live here once.
 */
async function sweepField<T extends { id: string }, V>({
  field,
  rows,
  index,
  tallies,
  fileIds,
  dryRun,
  onUnresolvedAddress,
  valueOf,
  rewrite,
  write,
}: {
  field: AddressSweepField;
  rows: readonly T[];
  index: StoredAddressIndex;
  tallies: ReadonlyMap<AddressSweepField, FieldTally>;
  fileIds: Set<string>;
  dryRun: boolean;
  onUnresolvedAddress?: (address: string, field: AddressSweepField) => void;
  valueOf: (row: T) => V | null | undefined;
  rewrite: (value: V, index: StoredAddressIndex) => AddressRewriteResult;
  write: (row: T, value: unknown) => Promise<unknown>;
}): Promise<void> {
  const tally = tallies.get(field)!;

  for (const row of rows) {
    const current = valueOf(row);
    if (current === null || current === undefined || current === "") continue;

    const result = rewrite(current, index);
    if (result.rewritten === 0 && result.unresolved === 0) continue;

    if (result.rewritten > 0) tally.rows += 1;
    tally.rewritten += result.rewritten;
    tally.unresolved += result.unresolved;
    for (const fileId of result.fileIds) fileIds.add(fileId);
    for (const address of result.unresolvedAddresses) {
      onUnresolvedAddress?.(address, field);
    }

    if (result.rewritten > 0 && !dryRun) {
      await write(row, result.value);
    }
  }
}

interface VersionRoot {
  liveVersionId: string | null;
  currentVersionId: string | null;
}

/**
 * The versions whose content a visitor can reach, or can reach at the next
 * publish: the live version and the current head of every root. A superseded
 * version is not rendered, and restoring one is not part of the product, so an
 * address it holds is not a dependency of the Installation and a run leaves it
 * exactly as it is.
 */
function readableVersionIds(roots: readonly VersionRoot[]): string[] {
  const ids = new Set<string>();

  for (const root of roots) {
    if (root.liveVersionId) ids.add(root.liveVersionId);
    if (root.currentVersionId) ids.add(root.currentVersionId);
  }

  return [...ids];
}

/**
 * The version rows a root set makes readable. A root set with no readable
 * version reads nothing rather than every version.
 */
async function readReadableVersions<T extends { id: string }>(
  roots: readonly VersionRoot[],
  find: (ids: string[]) => Promise<T[]>,
): Promise<T[]> {
  const ids = readableVersionIds(roots);

  return ids.length === 0 ? [] : find(ids);
}

/**
 * Rewrites every absolute provider address stored anywhere into the canonical
 * address of the file it points to, so the same installation can move its
 * bytes or leave its provider without breaking published content.
 *
 * The run never writes a stored file: keys, revisions, drivers and remote
 * locations are read, never changed. It is idempotent because an address that
 * already carries the canonical relative form is left alone, and a dry run
 * reports exactly what a write would do without writing anything.
 */
export async function sweepStorageAddresses({
  dryRun = false,
  addressOverrides,
  onUnresolvedAddress,
}: AddressSweepOptions = {}): Promise<AddressSweepReport> {
  const recorded = await readAddressIndex();
  const index: StoredAddressIndex =
    addressOverrides && addressOverrides.size > 0
      ? {
          byAddress: new Map([...recorded.byAddress, ...addressOverrides]),
          byKey: recorded.byKey,
        }
      : recorded;
  const fileIds = new Set<string>();
  const tallies = new Map<AddressSweepField, FieldTally>(
    ADDRESS_SWEEP_FIELDS.map((field) => [
      field,
      { rows: 0, rewritten: 0, unresolved: 0 },
    ]),
  );

  const pageVersions = await readReadableVersions(
    await db.pageRoot.findMany({
      select: { liveVersionId: true, currentVersionId: true },
    }),
    (ids) =>
      db.pageVersion.findMany({
        where: { id: { in: ids } },
        select: { id: true, puckData: true },
        orderBy: { id: "asc" },
      }),
  );

  await sweepField({
    field: "PageVersion.puckData",
    rows: pageVersions,
    index,
    tallies,
    fileIds,
    dryRun,
    onUnresolvedAddress,
    valueOf: (row) => row.puckData,
    rewrite: rewriteAddressesInValue,
    write: (row, puckData) =>
      db.pageVersion.update({
        where: { id: row.id },
        data: { puckData: puckData as PrismaJson.PuckData },
      }),
  });

  const regionVersions = await readReadableVersions(
    await db.siteRegion.findMany({
      select: { liveVersionId: true, currentVersionId: true },
    }),
    (ids) =>
      db.siteRegionVersion.findMany({
        where: { id: { in: ids } },
        select: { id: true, puckData: true },
        orderBy: { id: "asc" },
      }),
  );

  await sweepField({
    field: "SiteRegionVersion.puckData",
    rows: regionVersions,
    index,
    tallies,
    fileIds,
    dryRun,
    onUnresolvedAddress,
    valueOf: (row) => row.puckData,
    rewrite: rewriteAddressesInValue,
    write: (row, puckData) =>
      db.siteRegionVersion.update({
        where: { id: row.id },
        data: { puckData: puckData as PrismaJson.PuckData },
      }),
  });

  const postVersions = await readReadableVersions(
    await db.postRoot.findMany({
      select: { liveVersionId: true, currentVersionId: true },
    }),
    (ids) =>
      db.postVersion.findMany({
        where: { id: { in: ids } },
        select: { id: true, tiptapBodyData: true },
        orderBy: { id: "asc" },
      }),
  );

  await sweepField({
    field: "PostVersion.tiptapBodyData",
    rows: postVersions,
    index,
    tallies,
    fileIds,
    dryRun,
    onUnresolvedAddress,
    valueOf: (row) => row.tiptapBodyData,
    rewrite: rewriteAddressesInValue,
    write: (row, tiptapBodyData) =>
      db.postVersion.update({
        where: { id: row.id },
        data: {
          tiptapBodyData: tiptapBodyData as PrismaJson.TipTapBodyData,
        },
      }),
  });

  const productVersions = await readReadableVersions(
    await db.productRoot.findMany({
      select: { liveVersionId: true, currentVersionId: true },
    }),
    (ids) =>
      db.productVersion.findMany({
        where: { id: { in: ids } },
        select: { id: true, tiptapDescription: true },
        orderBy: { id: "asc" },
      }),
  );

  await sweepField({
    field: "ProductVersion.tiptapDescription",
    rows: productVersions,
    index,
    tallies,
    fileIds,
    dryRun,
    onUnresolvedAddress,
    valueOf: (row) => row.tiptapDescription,
    rewrite: rewriteAddressesInValue,
    write: (row, tiptapDescription) =>
      db.productVersion.update({
        where: { id: row.id },
        data: {
          tiptapDescription:
            tiptapDescription as PrismaJson.TipTapBodyData,
        },
      }),
  });

  const adItems = await db.adItem.findMany({
    select: { id: true, imageUrl: true },
    orderBy: { id: "asc" },
  });

  await sweepField({
    field: "AdItem.imageUrl",
    rows: adItems,
    index,
    tallies,
    fileIds,
    dryRun,
    onUnresolvedAddress,
    valueOf: (row) => row.imageUrl,
    rewrite: rewriteAddressesInString,
    write: (row, value) =>
      db.adItem.update({
        where: { id: row.id },
        data: { imageUrl: value as string },
      }),
  });

  const settingsRows = await db.settings.findMany({
    select: { id: true, logoUrl: true },
    orderBy: { id: "asc" },
  });

  await sweepField({
    field: "Settings.logoUrl",
    rows: settingsRows,
    index,
    tallies,
    fileIds,
    dryRun,
    onUnresolvedAddress,
    valueOf: (row) => row.logoUrl,
    rewrite: rewriteAddressesInString,
    write: (row, value) =>
      db.settings.update({
        where: { id: row.id },
        data: { logoUrl: value as string },
      }),
  });

  const submissions = await db.formSubmission.findMany({
    select: { id: true, data: true },
    orderBy: { id: "asc" },
  });

  await sweepField({
    field: "FormSubmission.data",
    rows: submissions,
    index,
    tallies,
    fileIds,
    dryRun,
    onUnresolvedAddress,
    valueOf: (row) => row.data,
    rewrite: rewriteAddressesInValue,
    write: (row, data) =>
      db.formSubmission.update({
        where: { id: row.id },
        data: { data: data as PrismaJson.SubmissionData },
      }),
  });

  const users = await db.user.findMany({
    select: { id: true, image: true, imageUrl: true },
    orderBy: { id: "asc" },
  });

  await sweepField({
    field: "User.image",
    rows: users,
    index,
    tallies,
    fileIds,
    dryRun,
    onUnresolvedAddress,
    valueOf: (row) => row.image,
    rewrite: rewriteAddressesInString,
    write: (row, value) =>
      db.user.update({
        where: { id: row.id },
        data: { image: value as string },
      }),
  });

  await sweepField({
    field: "User.imageUrl",
    rows: users,
    index,
    tallies,
    fileIds,
    dryRun,
    onUnresolvedAddress,
    valueOf: (row) => row.imageUrl,
    rewrite: rewriteAddressesInString,
    write: (row, value) =>
      db.user.update({
        where: { id: row.id },
        data: { imageUrl: value as string },
      }),
  });

  // The pre-role attachment table is still present during the rolling deploy
  // window. Nothing in this build reads it, but its URLs are stored content
  // and the sweep must leave no provider reference behind.
  const legacyAttachments = await db.$queryRaw<
    { id: string; url: string }[]
  >`SELECT "id", "url" FROM "EmailAttachment" ORDER BY "id" ASC`;

  await sweepField({
    field: "EmailAttachment.url",
    rows: legacyAttachments,
    index,
    tallies,
    fileIds,
    dryRun,
    onUnresolvedAddress,
    valueOf: (row) => row.url,
    rewrite: rewriteAddressesInString,
    write: (row, value) =>
      db.$executeRaw`UPDATE "EmailAttachment" SET "url" = ${value as string}, "updatedAt" = NOW() WHERE "id" = ${row.id}`,
  });

  const fields = ADDRESS_SWEEP_FIELDS.map((field) => ({
    field,
    ...tallies.get(field)!,
  }));

  const rows = fields.reduce((total, entry) => total + entry.rows, 0);
  const rewritten = fields.reduce(
    (total, entry) => total + entry.rewritten,
    0,
  );
  const unresolved = fields.reduce(
    (total, entry) => total + entry.unresolved,
    0,
  );

  return {
    dryRun,
    files: fileIds.size,
    rows,
    rewritten,
    unresolved,
    fields,
  };
}

/**
 * The process exit code for a finished sweep: an address no stored file owns
 * means the sweep could not do its job, so it can gate the next storage step.
 */
export function addressSweepExitCode(
  report: Pick<AddressSweepReport, "unresolved">,
): number {
  return report.unresolved > 0 ? 1 : 0;
}

/**
 * The operator-facing lines for one sweep. Field names and counts only: a
 * key, an address or a provider host must never reach the deployment log.
 */
export function formatAddressSweepReport(
  report: AddressSweepReport,
): string[] {
  const lines = [
    `dry run: ${report.dryRun ? "yes" : "no"}`,
    `files: ${report.files}`,
    `rows: ${report.rows}`,
    `addresses rewritten: ${report.rewritten}`,
    `unresolved: ${report.unresolved}`,
  ];

  for (const entry of report.fields) {
    if (entry.rewritten === 0 && entry.unresolved === 0) continue;

    lines.push(
      `  ${entry.field} rows=${entry.rows} rewritten=${entry.rewritten} unresolved=${entry.unresolved}`,
    );
  }

  return lines;
}
