import "server-only";

import { StoredFileKind, StoredFileOrigin } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { createFixedWindowLimiter } from "@/shared/lib/fixed-window-rate-limit";

import { storeOwnedFile, type StoredOwnedFile } from "@/modules/media/server/owned-file";

/**
 * A public form upload is anonymous, so the endpoint must bound both how large
 * one file may be and how many files one client or one form can ask for. A
 * window is small enough to stop a burst and large enough for a real answer
 * with a few attachments.
 */
export const PUBLIC_FORM_UPLOAD_CLIENT_LIMIT = {
  maxRequests: 10,
  windowMs: 60_000,
} as const;
export const PUBLIC_FORM_UPLOAD_FORM_LIMIT = {
  maxRequests: 30,
  windowMs: 60_000,
} as const;

const limiter = createFixedWindowLimiter();

export type PublicUploadRateLimitScope = "client" | "form";

export type PublicUploadRateLimitResult =
  | { allowed: true }
  | { allowed: false; scope: PublicUploadRateLimitScope; retryAfterMs: number };

function refusal(
  scope: PublicUploadRateLimitScope,
  retryAfterMs: number | undefined,
): PublicUploadRateLimitResult {
  return {
    allowed: false,
    scope,
    retryAfterMs: retryAfterMs ?? 0,
  };
}

/**
 * The cheap dimension, checked before the body is read: one client cannot
 * spend another client's budget.
 */
export function checkPublicFormUploadClientRateLimit(
  clientKey: string,
): PublicUploadRateLimitResult {
  const result = limiter.check(
    `client:${clientKey}`,
    PUBLIC_FORM_UPLOAD_CLIENT_LIMIT,
  );

  return result.allowed
    ? { allowed: true }
    : refusal("client", result.retryAfterMs);
}

/**
 * The owner's dimension: a burst against one form is refused however many
 * clients send it. Checked once the request is a real file for a real form, so
 * an empty POST cannot exhaust the form's budget.
 */
export function checkPublicFormUploadFormRateLimit(
  formId: string,
): PublicUploadRateLimitResult {
  const result = limiter.check(
    `form:${formId}`,
    PUBLIC_FORM_UPLOAD_FORM_LIMIT,
  );

  return result.allowed
    ? { allowed: true }
    : refusal("form", result.retryAfterMs);
}

/** Drops every window. Intended for tests. */
export function resetPublicFormUploadRateLimit(): void {
  limiter.clear();
}

export class PublicFormAttachmentError extends Error {
  code: string;
  status: number;
  details: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    status: number,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "PublicFormAttachmentError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Reads the client's identity from the proxy headers the deployment sets. A
 * bare `x-forwarded-for` is a list a client can prepend to, so the entry the
 * proxy appended (the last one) is the one to trust. A missing header still
 * gets one shared bucket rather than no limit at all.
 */
export function clientKeyForRequest(headers: Headers): string {
  const forwarded = headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return forwarded?.at(-1) || headers.get("x-real-ip")?.trim() || "unknown";
}

export async function requirePublicForm(formId: string): Promise<void> {
  const form = await db.form.findUnique({
    where: { id: formId },
    select: { id: true },
  });

  if (!form) {
    throw new PublicFormAttachmentError(
      "FORM_NOT_FOUND",
      "This form does not exist.",
      404,
    );
  }
}

/**
 * Writes one visitor's attachment through the active driver. The caller has
 * already read the file with the public cap and proved the form exists; the
 * record is labelled public-origin so the budget can protect the owner, and
 * the returned address is the Installation's own `/files/<key>`, never a
 * provider address.
 */
export async function storePublicFormAttachment({
  file,
}: {
  file: File;
}): Promise<StoredOwnedFile> {
  return storeOwnedFile({
    kind: StoredFileKind.ATTACHMENT,
    origin: StoredFileOrigin.PUBLIC,
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    bytes: new Uint8Array(await file.arrayBuffer()),
  });
}
