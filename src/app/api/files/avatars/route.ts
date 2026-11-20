import { NextResponse } from "next/server";

import { StoredFileKind } from "@/generated/prisma";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { AVATAR_MAX_UPLOAD_BYTES } from "@/modules/media/lib/upload-limits";

import { createOwnedUploadHandler } from "../_lib/upload-owned-route";

/**
 * The admin avatar transport. An avatar is an image stored through the active
 * driver, so it works on an Installation with no provider token. The file is
 * unowned until the user update that names it claims it, which is what makes
 * a cancelled edit leave no avatar on the account.
 */
export const POST = createOwnedUploadHandler({
  permission: PERMISSIONS.USERS_UPDATE,
  kind: StoredFileKind.AVATAR,
  maxBytes: AVATAR_MAX_UPLOAD_BYTES,
  noun: "image",
  logTag: "[AVATAR_UPLOAD]",
  checkType: (file) =>
    file.type.startsWith("image/")
      ? null
      : NextResponse.json(
          {
            code: "UNSUPPORTED_MEDIA_TYPE",
            error: "An avatar must be an image.",
            mimeType: file.type || null,
          },
          { status: 415 },
        ),
});
