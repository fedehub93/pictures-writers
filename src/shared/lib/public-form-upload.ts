/**
 * One file in an Upload field's answer. `storedFileId` is the record the
 * submission claims when it is saved; `url` is always the Installation's own
 * canonical `/files/<key>` address, never a provider address.
 *
 * `key` is the legacy provider key kept on submissions recorded before the
 * public transport existed. It is optional because new answers do not have
 * one.
 */
export interface PublicFormAttachment {
  storedFileId?: string;
  key?: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

/** An answer written by the public transport, so it names a claimable record. */
export type StoredFormAttachment = PublicFormAttachment & {
  storedFileId: string;
};

/** The old public endpoint accepted five files per field; keep that cap. */
export const PUBLIC_FORM_ATTACHMENT_MAX_FILES = 5;

/**
 * A public form submission is anonymous, so its per-file cap is the old
 * public endpoint's 4 MB: the smallest limit the product already had, not the
 * admin attachment limit.
 */
export const PUBLIC_FORM_ATTACHMENT_MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export class PublicFormUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicFormUploadError";
  }
}

/**
 * Uploads one file through the Installation's own transport. The visitor is
 * anonymous, so the server rate-limits the call per client and per form,
 * caps its size and labels the record public-origin; the browser never
 * contacts a storage provider.
 */
export async function uploadPublicFormFile(
  formId: string,
  file: File,
): Promise<StoredFormAttachment> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(
    `/api/forms/${encodeURIComponent(formId)}/attachments`,
    {
      method: "POST",
      body: form,
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new PublicFormUploadError(
      body?.error ?? "The file could not be uploaded.",
    );
  }

  return (await response.json()) as StoredFormAttachment;
}
