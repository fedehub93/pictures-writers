import "server-only";

import { db } from "@/shared/lib/db";
import {
  type StorageDriverChoice,
  type StorageDriverName,
} from "@/modules/media/lib/storage-driver";

import {
  driverForStorageDriver,
  isUploadThingConfigured,
  storageDriverNameFromSetting,
  type ResolvedStorageDriver,
  type StorageEnvironment,
} from "./driver";

export type { StorageDriverChoice };

/**
 * The active storage driver, resolved per request in this order: the choice
 * saved in Installation settings, then the environment, then today's default.
 *
 * Nothing captures the result at module load: saving the setting in the media
 * library is visible to the next upload without a restart or a redeploy. Only
 * new writes are affected — delivery resolves the driver recorded on each
 * Media row, so a switch never darkens media already stored.
 */
export async function resolveActiveStorageDriver(
  env: StorageEnvironment = process.env,
): Promise<ResolvedStorageDriver> {
  const name = await getActiveStorageDriverName(env);

  return { driver: driverForStorageDriver(name, env), name };
}

export async function getActiveStorageDriverName(
  env: StorageEnvironment = process.env,
): Promise<StorageDriverName> {
  const settings = await db.settings.findFirst({
    select: { storageDriver: true },
  });

  return storageDriverNameFromSetting(settings?.storageDriver, env);
}

/** The media library's view of the choice: the effective driver and what can be offered. */
export async function getStorageDriverChoice(
  env: StorageEnvironment = process.env,
): Promise<StorageDriverChoice> {
  return {
    active: await getActiveStorageDriverName(env),
    uploadThingAvailable: isUploadThingConfigured(env),
  };
}
