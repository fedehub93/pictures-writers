import "server-only";

export class StorageObjectNotFoundError extends Error {
  constructor(readonly key: string) {
    super(`Storage object not found: "${key}"`);
    this.name = "StorageObjectNotFoundError";
  }
}

export interface StorageDriver {
  put(key: string, bytes: Uint8Array<ArrayBuffer>, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array<ArrayBuffer>>;
  delete(key: string): Promise<void>;
  deletePrefix(prefix: string): Promise<number>;
  url(key: string): Promise<string>;
}
