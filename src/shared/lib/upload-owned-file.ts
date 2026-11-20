export interface OwnedFileUpload {
  storedFileId: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
}

export class OwnedFileUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OwnedFileUploadError";
  }
}

/**
 * Uploads one file through the application transport. The server picks the
 * active driver, writes the bytes and returns the canonical address; the
 * browser never contacts a storage provider.
 */
export async function uploadOwnedFile(
  endpoint: "/api/files/attachments" | "/api/files/avatars",
  file: File,
): Promise<OwnedFileUpload> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(endpoint, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { code?: string; error?: string }
      | null;

    throw new OwnedFileUploadError(
      body?.error ?? "The file could not be uploaded.",
    );
  }

  return (await response.json()) as OwnedFileUpload;
}
