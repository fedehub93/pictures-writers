import { NextResponse } from "next/server";

import { StoredFileKind } from "@/generated/prisma";
import { authAdmin } from "@/lib/auth-service";
import { readMultipartFile } from "@/shared/lib/multipart-upload";

import { storeOwnedFile } from "@/modules/media/server/owned-file";

export interface OwnedUploadRouteOptions {
  /** Permission the caller must hold to use this transport. */
  permission: string;
  kind: StoredFileKind;
  maxBytes: number;
  /** The word the refusal messages use, e.g. "file" or "image". */
  noun: string;
  /** Optional type check applied after the file is read. */
  checkType?: (file: File) => NextResponse | null;
  logTag: string;
}

/**
 * The one admin transport for owned files. The attachment and avatar
 * endpoints differ only in permission, kind, size limit and the optional type
 * check; everything else — auth, multipart, refusal codes, the active driver
 * and the canonical response — is shared so the two cannot drift.
 */
export function createOwnedUploadHandler({
  permission,
  kind,
  maxBytes,
  noun,
  checkType,
  logTag,
}: OwnedUploadRouteOptions) {
  return async function POST(req: Request): Promise<Response> {
    try {
      const user = await authAdmin(permission);

      if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

      const parsed = await readMultipartFile(req, { noun, maxBytes });
      if ("refusal" in parsed) return parsed.refusal;

      const { file } = parsed;
      const typeRefusal = checkType?.(file);
      if (typeRefusal) return typeRefusal;

      const stored = await storeOwnedFile({
        kind,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        bytes: new Uint8Array(await file.arrayBuffer()),
      });

      return NextResponse.json({
        storedFileId: stored.id,
        url: stored.address,
        filename: file.name,
        contentType: stored.contentType,
        size: stored.size,
      });
    } catch (error) {
      console.log(logTag, error);
      return new NextResponse("Internal Error", { status: 500 });
    }
  };
}
