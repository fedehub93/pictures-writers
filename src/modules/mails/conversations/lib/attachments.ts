import "server-only";

import { StoredFileKind } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { getSettings } from "@/data/settings";

import { storedFilePath } from "@/modules/media/lib/file-path";
import { absoluteMediaUrl } from "@/modules/media/server/media-url";
import type { OutboundAttachment } from "@/modules/mails/lib/types";

/** What the composer hands the send use-case after the upload transport runs. */
export interface AttachmentInput {
  storedFileId: string;
  filename: string;
}

export interface ResolvedOutboundAttachments {
  /** The Attachment rows to create with the message. */
  create: { filename: string; storedFileId: string }[];
  /** The provider's view: absolute canonical addresses it can fetch. */
  provider: OutboundAttachment[];
}

export class AttachmentResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttachmentResolutionError";
  }
}

const outboundAttachmentSelect = {
  id: true,
  key: true,
  contentType: true,
  size: true,
  attachment: { select: { id: true } },
} as const;

/**
 * Proves every attachment the composer sent is an unowned stored file of kind
 * ATTACHMENT, and gives the provider absolute canonical addresses. The address
 * is made absolute only here, at the mail boundary, and never names a driver.
 */
export async function resolveOutboundAttachments(
  inputs: AttachmentInput[] | undefined,
): Promise<ResolvedOutboundAttachments> {
  if (!inputs?.length) return { create: [], provider: [] };

  const ids = inputs.map((input) => input.storedFileId);
  if (new Set(ids).size !== ids.length) {
    throw new AttachmentResolutionError(
      "The same attachment was added more than once.",
    );
  }

  const files = await db.storedFile.findMany({
    where: { id: { in: ids }, kind: StoredFileKind.ATTACHMENT },
    select: outboundAttachmentSelect,
  });
  const byId = new Map(files.map((file) => [file.id, file]));

  for (const id of ids) {
    const file = byId.get(id);
    if (!file) {
      throw new AttachmentResolutionError(
        "An attachment could not be found. Upload it again and retry.",
      );
    }
    if (file.attachment) {
      throw new AttachmentResolutionError(
        "An attachment has already been sent.",
      );
    }
  }

  const { siteUrl } = await getSettings();
  const baseUrl =
    siteUrl?.replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    null;

  const provider = inputs.map((input) => {
    const file = byId.get(input.storedFileId)!;
    const address = storedFilePath("ATTACHMENT", file.key);

    return {
      filename: input.filename,
      contentType: file.contentType ?? "application/octet-stream",
      url: baseUrl ? absoluteMediaUrl(address, baseUrl) : address,
      ...(file.size === null ? {} : { size: file.size }),
    };
  });

  return {
    create: inputs.map((input) => ({
      filename: input.filename,
      storedFileId: input.storedFileId,
    })),
    provider,
  };
}
