import { NextResponse } from "next/server";

import { readMultipartFile } from "@/shared/lib/multipart-upload";
import { PUBLIC_FORM_ATTACHMENT_MAX_UPLOAD_BYTES } from "@/shared/lib/public-form-upload";

import {
  checkPublicFormUploadClientRateLimit,
  checkPublicFormUploadFormRateLimit,
  clientKeyForRequest,
  PublicFormAttachmentError,
  requirePublicForm,
  storePublicFormAttachment,
} from "@/modules/forms/server/public-attachments";

function rateLimited(retryAfterMs: number): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

  return NextResponse.json(
    {
      code: "RATE_LIMITED",
      error: "Too many uploads. Try again later.",
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

/**
 * The visitor-facing attachment transport. It is anonymous, so it is
 * rate-limited per client and per form, caps the file size and labels what it
 * writes public-origin. The answer carries the `storedFileId` the submission
 * claims and the canonical `/files/<key>` address — never a provider address.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ formId: string }> },
): Promise<Response> {
  try {
    const { formId } = await params;

    const clientLimit = checkPublicFormUploadClientRateLimit(
      clientKeyForRequest(req.headers),
    );
    if (!clientLimit.allowed) return rateLimited(clientLimit.retryAfterMs);

    const parsed = await readMultipartFile(req, {
      noun: "file",
      maxBytes: PUBLIC_FORM_ATTACHMENT_MAX_UPLOAD_BYTES,
    });
    if ("refusal" in parsed) return parsed.refusal;

    // The form budget is spent only by a real file for a real form, so an
    // empty POST cannot deny uploads to its visitors.
    await requirePublicForm(formId);

    const formLimit = checkPublicFormUploadFormRateLimit(formId);
    if (!formLimit.allowed) return rateLimited(formLimit.retryAfterMs);

    const stored = await storePublicFormAttachment({ file: parsed.file });

    return NextResponse.json({
      storedFileId: stored.id,
      url: stored.address,
      name: parsed.file.name,
      size: stored.size,
      type: stored.contentType,
    });
  } catch (error) {
    if (error instanceof PublicFormAttachmentError) {
      return NextResponse.json(
        { code: error.code, error: error.message, ...error.details },
        { status: error.status },
      );
    }

    console.log("[PUBLIC_FORM_ATTACHMENT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
