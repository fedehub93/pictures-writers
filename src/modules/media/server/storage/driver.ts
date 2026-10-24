import "server-only";

import path from "node:path";
import { UTApi } from "uploadthing/server";

import { createLocalStorageDriver } from "./local";
import type { StorageDriver } from "./types";
import { createUploadThingStorageDriver } from "./uploadthing";

export type StorageDriverConfig =
  | { driver: "uploadthing"; token?: string }
  | { driver: "local"; root: string; publicBaseUrl: string };

export type StorageEnvironment = Record<string, string | undefined>;

export const DEFAULT_LOCAL_ROOT = ".media-storage";
export const DEFAULT_LOCAL_PUBLIC_URL = "/media";

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
      root: env.MEDIA_STORAGE_LOCAL_ROOT || path.resolve(DEFAULT_LOCAL_ROOT),
      publicBaseUrl: env.MEDIA_STORAGE_LOCAL_PUBLIC_URL || DEFAULT_LOCAL_PUBLIC_URL,
    };
  }

  throw new Error(
    `Unknown MEDIA_STORAGE_DRIVER "${env.MEDIA_STORAGE_DRIVER}". Expected "uploadthing" or "local".`,
  );
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

let defaultDriver: StorageDriver | undefined;

export function getStorageDriver(): StorageDriver {
  defaultDriver ??= createStorageDriver();
  return defaultDriver;
}
