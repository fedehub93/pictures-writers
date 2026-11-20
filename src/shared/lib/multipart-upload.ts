import "server-only";

import { NextResponse } from "next/server";

import { formatBytes } from "@/lib/format";

export interface MultipartFileOptions {
  maxBytes: number;
  /** The word the refusal messages use, e.g. "file" or "image". */
  noun: string;
}

export type MultipartFileResult =
  | { file: File }
  | { refusal: NextResponse };

function noFile(noun: string): NextResponse {
  return NextResponse.json(
    { code: "NO_FILE", error: `A ${noun} is required.` },
    { status: 400 },
  );
}

function tooLarge(noun: string, maxBytes: number): NextResponse {
  return NextResponse.json(
    {
      code: "FILE_TOO_LARGE",
      error: `This ${noun} is larger than the ${formatBytes(
        maxBytes,
        0,
      )} upload limit.`,
      maxBytes,
    },
    { status: 413 },
  );
}

/**
 * Reads the one `file` part every upload transport accepts, with the same
 * machine-readable refusals. The body is refused before it is buffered when
 * its announced length is clearly over the cap; the part is checked again
 * after parsing because the header can be absent.
 */
export async function readMultipartFile(
  req: Request,
  { maxBytes, noun }: MultipartFileOptions,
): Promise<MultipartFileResult> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return { refusal: noFile(noun) };
  }

  // The multipart envelope is small; the slack only covers its headers.
  const announcedLength = Number(req.headers.get("content-length") ?? "");
  if (
    Number.isFinite(announcedLength) &&
    announcedLength > maxBytes + 64 * 1024
  ) {
    return { refusal: tooLarge(noun, maxBytes) };
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return { refusal: noFile(noun) };
  }

  const file = form.get("file");

  if (!(file instanceof File)) {
    return { refusal: noFile(noun) };
  }

  if (file.size > maxBytes) {
    return { refusal: tooLarge(noun, maxBytes) };
  }

  return { file };
}
