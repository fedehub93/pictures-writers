import "server-only";

import path from "node:path";
import { UTApi } from "uploadthing/server";

import {
  parseStorageDriver,
  type StorageDriverName,
} from "@/modules/media/lib/storage-driver";

import { createLocalStorageDriver } from "./local";
import type { StorageDriver } from "./types";
import { createUploadThingStorageDriver } from "./uploadthing";

export type { StorageDriverName };

export type StorageDriverConfig =
  | { driver: "uploadthing"; token?: string }
  | { driver: "local"; root: string };

export type StorageEnvironment = Record<string, string | undefined>;

export const DEFAULT_LOCAL_ROOT = ".media-storage";
export const DEFAULT_INSTALLATION_SLUG = "default";

export function storageConfigFromEnv(
  env: StorageEnvironment = process.env,
): StorageDriverConfig {
  const configured = env.MEDIA_STORAGE_DRIVER?.trim().toLowerCase();
  const name = configured || "uploadthing";

  if (name === "uploadthing") {
    return { driver: "uploadthing", token: env.UPLOADTHING_TOKEN };
  }

  if (name === "local") {
    return {
      driver: "local",
      root: getLocalStorageRoot(env),
    };
  }

  throw new Error(
    `Unknown MEDIA_STORAGE_DRIVER "${env.MEDIA_STORAGE_DRIVER}". Expected "uploadthing" or "local".`,
  );
}

export interface ResolvedStorageDriver {
  driver: StorageDriver;
  name: StorageDriverName;
}

export function getInstallationSlug(
  env: StorageEnvironment = process.env,
): string {
  const slug = env.INSTALLATION_SLUG?.trim();
  return slug || DEFAULT_INSTALLATION_SLUG;
}

export function getLocalStorageRoot(
  env: StorageEnvironment = process.env,
): string {
  return env.MEDIA_STORAGE_LOCAL_ROOT || path.resolve(DEFAULT_LOCAL_ROOT);
}

/**
 * Whether the UploadThing choice can be offered at all. The token stays in the
 * environment until storage becomes an Integration; without it the media
 * library disables the option instead of letting an upload fail.
 */
export function isUploadThingConfigured(
  env: StorageEnvironment = process.env,
): boolean {
  return Boolean(env.UPLOADTHING_TOKEN?.trim());
}

/**
 * Whether this instance can reach the driver. Local disk is always available;
 * UploadThing needs its token. A row recorded against an unconfigured driver
 * still resolves for delivery, but an operation cannot clean its objects up.
 */
export function isStorageDriverConfigured(
  name: StorageDriverName,
  env: StorageEnvironment = process.env,
): boolean {
  switch (name) {
    case "local":
      return true;
    case "uploadthing":
      return isUploadThingConfigured(env);
  }
}

/**
 * The driver a new upload will use: the saved Installation setting first, then
 * the environment, then today's default. A stored value the application no
 * longer knows is treated as absent so an upgrade never breaks uploads; the
 * settings API rejects such a value before it can be written.
 */
export function storageDriverNameFromSetting(
  setting: unknown,
  env: StorageEnvironment = process.env,
): StorageDriverName {
  return parseStorageDriver(setting) ?? storageConfigFromEnv(env).driver;
}

export function createStorageDriver(
  config: StorageDriverConfig = storageConfigFromEnv(),
): StorageDriver {
  switch (config.driver) {
    case "local":
      return createLocalStorageDriver(config);
    case "uploadthing":
      return createUploadThingStorageDriver(
        config.token ? new UTApi({ token: config.token }) : new UTApi(),
      );
  }
}

export function resolveStorageDriver(
  env: StorageEnvironment = process.env,
): ResolvedStorageDriver {
  const config = storageConfigFromEnv(env);
  return { driver: createStorageDriver(config), name: config.driver };
}

export function getStorageDriver(env?: StorageEnvironment): StorageDriver {
  return resolveStorageDriver(env).driver;
}

export type RecordedStorageDriverResolution =
  | { resolved: true; driver: StorageDriver; name: StorageDriverName }
  | {
      resolved: false;
      /** Why the row's objects cannot be reached from this instance. */
      reason: string;
    };

/**
 * The driver that owns one Media row's objects, resolved from the driver
 * recorded on that row rather than from the active choice.
 *
 * A row with no recorded driver was written before the storage seam landed: it
 * lives on UploadThing and resolves as remote. A name this build does not know
 * is unresolvable rather than a reason to guess, and a driver whose credentials
 * are absent here is reported so a batch can skip it instead of failing.
 */
export function resolveMediaStorageDriver(
  recorded: string | null,
  {
    activeDriver,
    activeDriverName,
    env = process.env,
  }: {
    activeDriver: StorageDriver;
    activeDriverName: StorageDriverName;
    env?: StorageEnvironment;
  },
): RecordedStorageDriverResolution {
  const known = parseStorageDriver(recorded);
  const name = known ?? (recorded === null ? "uploadthing" : null);

  if (name === null) {
    return { resolved: false, reason: `unknown storage driver "${recorded}"` };
  }

  if (!isStorageDriverConfigured(name, env)) {
    return { resolved: false, reason: `storage driver "${name}" is not configured` };
  }

  return {
    resolved: true,
    name,
    driver:
      name === activeDriverName
        ? activeDriver
        : driverForStorageDriver(name, env),
  };
}

export function driverForStorageDriver(
  name: string | null | undefined,
  env: StorageEnvironment = process.env,
): StorageDriver {
  const driverName = (name ?? "uploadthing") as StorageDriverName;

  switch (driverName) {
    case "local":
      return createLocalStorageDriver({
        root: getLocalStorageRoot(env),
      });
    case "uploadthing":
      return createUploadThingStorageDriver(
        env.UPLOADTHING_TOKEN
          ? new UTApi({ token: env.UPLOADTHING_TOKEN })
          : new UTApi(),
      );
    default:
      return createStorageDriver(storageConfigFromEnv(env));
  }
}
