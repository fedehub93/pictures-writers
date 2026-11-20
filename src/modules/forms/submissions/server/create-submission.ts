import "server-only";

import { Prisma, StoredFileKind, StoredFileOrigin } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { storedFilePath } from "@/modules/media/lib/file-path";

/**
 * A submission that points at an attachment the Installation cannot claim. The
 * visitor sees a normal refusal; nothing is written.
 */
export class FormSubmissionAttachmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormSubmissionAttachmentError";
  }
}

interface AttachmentReference {
  filename: string | null;
}

interface ClaimedAttachment {
  filename: string;
  /** The canonical address composed from the stored file's key. */
  url: string;
  size: number;
  type: string;
}

/**
 * Finds every stored-file reference in the answers. Upload fields hold an
 * array of descriptors, but the walk is shape-agnostic: any object carrying a
 * `storedFileId` string is a reference, whatever field it sits under.
 */
function collectAttachmentReferences(
  value: unknown,
  found: Map<string, AttachmentReference>,
): void {
  if (Array.isArray(value)) {
    for (const item of value) collectAttachmentReferences(item, found);
    return;
  }

  if (!value || typeof value !== "object") return;

  const record = value as Record<string, unknown>;
  const storedFileId = record.storedFileId;

  if (typeof storedFileId === "string" && storedFileId.length > 0) {
    const name =
      typeof record.name === "string" && record.name.trim().length > 0
        ? record.name
        : null;

    if (!found.has(storedFileId)) found.set(storedFileId, { filename: name });
  }

  for (const nested of Object.values(record)) {
    collectAttachmentReferences(nested, found);
  }
}

/**
 * Replaces every answer descriptor that names a claimed attachment with the
 * record's own projection. The visitor's `url` (and any legacy provider `key`)
 * is discarded rather than trusted, so the stored submission can only point at
 * the Installation's own address.
 */
function rewriteAttachmentAnswers(
  value: unknown,
  claimed: Map<string, ClaimedAttachment>,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteAttachmentAnswers(item, claimed));
  }

  if (!value || typeof value !== "object") return value;

  const record = value as Record<string, unknown>;
  const storedFileId = record.storedFileId;

  if (typeof storedFileId === "string" && claimed.has(storedFileId)) {
    const file = claimed.get(storedFileId)!;

    return {
      storedFileId,
      name: file.filename,
      url: file.url,
      size: file.size,
      type: file.type,
    };
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, nested]) => [
      key,
      rewriteAttachmentAnswers(nested, claimed),
    ]),
  );
}

function filenameFromKey(key: string): string {
  return key.split("/").filter(Boolean).pop() ?? "attachment";
}

export interface CreateFormSubmissionInput {
  formId: string;
  email: string | null;
  data: Record<string, unknown>;
}

/**
 * The one way a form answer becomes a `FormSubmission`. It claims the
 * attachments the visitor uploaded through the public transport in the same
 * transaction, so the row, its roles and the answers agree: the data points at
 * a canonical `/files/<key>` address and at the stored file, never at a
 * provider.
 */
export async function createFormSubmission({
  formId,
  email,
  data,
}: CreateFormSubmissionInput) {
  const references = new Map<string, AttachmentReference>();
  collectAttachmentReferences(data, references);

  const ids = [...references.keys()];
  const claimed = new Map<string, ClaimedAttachment>();
  const attachments: { filename: string; storedFileId: string }[] = [];

  if (ids.length > 0) {
    const files = await db.storedFile.findMany({
      where: {
        id: { in: ids },
        kind: StoredFileKind.ATTACHMENT,
        origin: StoredFileOrigin.PUBLIC,
      },
      select: {
        id: true,
        key: true,
        contentType: true,
        size: true,
        attachment: { select: { id: true } },
      },
    });
    const byId = new Map(files.map((file) => [file.id, file]));

    for (const id of ids) {
      const file = byId.get(id);

      // A missing record, a file of another role or origin, or one another
      // submission already claimed is a refusal: the answer would otherwise
      // point at bytes this Installation cannot prove it owns.
      if (!file || file.attachment) {
        throw new FormSubmissionAttachmentError(
          "An attachment could not be saved. Upload it again and retry.",
        );
      }

      const filename =
        references.get(id)?.filename ?? filenameFromKey(file.key);

      claimed.set(id, {
        filename,
        url: storedFilePath("ATTACHMENT", file.key),
        size: file.size ?? 0,
        type: file.contentType ?? "application/octet-stream",
      });
      attachments.push({ filename, storedFileId: id });
    }
  }

  const storedData = rewriteAttachmentAnswers(data, claimed) as Record<
    string,
    unknown
  >;

  try {
    return await db.$transaction(async (transaction) => {
      const submission = await transaction.formSubmission.create({
        data: {
          formId,
          email,
          data: storedData,
        },
      });

      if (attachments.length > 0) {
        await transaction.attachment.createMany({
          data: attachments.map((attachment) => ({
            ...attachment,
            formSubmissionId: submission.id,
          })),
        });
      }

      return submission;
    });
  } catch (error) {
    // Two submissions that raced on the same upload: the unique stored-file
    // reference refuses the second, and the whole transaction rolls back.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new FormSubmissionAttachmentError(
        "An attachment has already been used. Upload it again and retry.",
      );
    }

    throw error;
  }
}
