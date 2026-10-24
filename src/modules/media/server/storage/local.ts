import "server-only";

import { mkdir, readdir, readFile, rmdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { StorageObjectNotFoundError, type StorageDriver } from "./types";

export interface LocalStorageOptions {
  root: string;
  publicBaseUrl: string;
}

function assertSafePath(value: string, label: "key" | "prefix"): void {
  if (
    value.length === 0 ||
    value.startsWith("/") ||
    value.includes("\\") ||
    value.includes("\0") ||
    value.split("/").some((segment) => segment === "." || segment === "..")
  ) {
    throw new Error(`Invalid storage ${label}: "${value}"`);
  }
}

function assertSafeKey(key: string): void {
  assertSafePath(key, "key");

  if (key.split("/").some((segment) => segment.length === 0)) {
    throw new Error(`Invalid storage key: "${key}"`);
  }
}

function assertSafePrefix(prefix: string): void {
  assertSafePath(prefix, "prefix");
}

function objectPath(root: string, key: string): string {
  assertSafeKey(key);
  return path.join(root, ...key.split("/"));
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

async function withKeyNotFound<T>(
  key: string,
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (isMissingFile(error)) throw new StorageObjectNotFoundError(key);
    throw error;
  }
}

async function listKeys(root: string, directory = root): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (isMissingFile(error)) return [];
    throw error;
  }

  const keys: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      keys.push(...(await listKeys(root, entryPath)));
    } else {
      keys.push(path.relative(root, entryPath).split(path.sep).join("/"));
    }
  }
  return keys;
}

async function pruneEmptyDirectories(root: string, directory: string): Promise<void> {
  let current = directory;

  while (current !== root) {
    const relative = path.relative(root, current);
    if (relative.length === 0 || relative.startsWith("..")) return;

    try {
      await rmdir(current);
    } catch {
      return;
    }
    current = path.dirname(current);
  }
}

export function createLocalStorageDriver({
  root,
  publicBaseUrl,
}: LocalStorageOptions): StorageDriver {
  return {
    async put(key, bytes) {
      const file = objectPath(root, key);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, bytes);
    },

    async get(key) {
      return withKeyNotFound(
        key,
        async () => new Uint8Array(await readFile(objectPath(root, key))),
      );
    },

    async delete(key) {
      const file = objectPath(root, key);
      await withKeyNotFound(key, () => unlink(file));
      await pruneEmptyDirectories(root, path.dirname(file));
    },

    async deletePrefix(prefix) {
      assertSafePrefix(prefix);

      const keys = (await listKeys(root)).filter((key) =>
        key.startsWith(prefix),
      );

      for (const key of keys) {
        const file = objectPath(root, key);
        await unlink(file);
        await pruneEmptyDirectories(root, path.dirname(file));
      }

      return keys.length;
    },

    async url(key) {
      const file = objectPath(root, key);
      await withKeyNotFound(key, () => stat(file));

      const base = publicBaseUrl.replace(/\/+$/, "");
      return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
    },
  };
}
