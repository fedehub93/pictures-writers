import "dotenv/config";

import { createInterface } from "node:readline/promises";

import { parseStorageDriver, STORAGE_DRIVERS } from "@/modules/media/lib/storage-driver";
import {
  DEFAULT_PURGE_GRACE_DAYS,
  pendingPurge,
  purgeStorageObjects,
} from "@/modules/media/server/purge";

const DAY_MS = 24 * 60 * 60 * 1000;

function argument(argv: string[], name: string): string | undefined {
  const flag = `--${name}`;
  const index = argv.indexOf(flag);
  if (index !== -1 && index + 1 < argv.length) return argv[index + 1];

  const prefix = `${flag}=`;
  return argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function graceDays(argv: string[]): number {
  const raw = argument(argv, "grace-days");
  if (!raw) return DEFAULT_PURGE_GRACE_DAYS;

  const days = Number(raw);
  return Number.isFinite(days) && days >= 0 ? days : Number.NaN;
}

async function typedConfirmation(driver: string, objects: number): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question(
      `Type "${driver}" to delete ${objects} provider object${objects === 1 ? "" : "s"}: `,
    );
  } finally {
    rl.close();
  }
}

/**
 * Deletes exactly the provider objects a Re-home recorded, after a grace
 * window, and nothing else. It is the one irreversible step in the storage
 * lifecycle: it refuses while a stored file still records the driver or the
 * audit is not green, and it demands the driver's name typed by the operator.
 *
 * Without `--driver` it prints the journal grouped by driver and exits
 * non-zero, so the choice is explicit. `--grace-days` shortens the default
 * seven-day recovery window.
 */
async function main() {
  const days = graceDays(process.argv);
  if (Number.isNaN(days)) {
    console.error("--grace-days must be a number of days, zero or greater.");
    process.exitCode = 1;
    return;
  }

  const graceMs = days * DAY_MS;
  const journal = await pendingPurge({ graceMs });
  const driverArg = argument(process.argv, "driver");

  if (!driverArg) {
    if (journal.length === 0) {
      console.log("The purge journal is empty: nothing to delete.");
      return;
    }

    console.log("Purge journal:");
    for (const summary of journal) {
      console.log(
        `  ${summary.driver}: ${summary.entries} objects (${summary.waiting} waiting), ${summary.bytes} bytes`,
      );
    }
    console.error("Choose one with --driver <name>.");
    process.exitCode = 1;
    return;
  }

  const driver = parseStorageDriver(driverArg);
  if (!driver) {
    console.error(
      `Unknown driver "${driverArg}". Expected one of: ${STORAGE_DRIVERS.join(", ")}.`,
    );
    process.exitCode = 1;
    return;
  }

  const summary = journal.find((entry) => entry.driver === driver);
  if (!summary) {
    console.log(`The purge journal has no objects for "${driver}".`);
    return;
  }

  const eligible = summary.eligible;

  console.log(`driver: ${driver}`);
  console.log(`objects: ${summary.entries}`);
  console.log(`eligible: ${eligible}`);
  console.log(`waiting: ${summary.waiting}`);
  console.log(`bytes: ${summary.bytes}`);
  console.log(`grace days: ${days}`);

  const report = await purgeStorageObjects({
    driver,
    confirmation: () => typedConfirmation(driver, eligible),
    graceMs,
  });

  console.log(`deleted: ${report.deleted}`);
  console.log(`waiting: ${report.waiting}`);
  console.log(`bytes deleted: ${report.bytesDeleted}`);
  console.log(`failed: ${report.failed.length}`);
  for (const failure of report.failed) {
    console.log(`  ${failure.entryId} ${failure.reason}`);
  }

  process.exitCode = report.failed.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
