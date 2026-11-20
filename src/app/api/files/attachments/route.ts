import { StoredFileKind } from "@/generated/prisma";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { ATTACHMENT_MAX_UPLOAD_BYTES } from "@/modules/media/lib/upload-limits";

import { createOwnedUploadHandler } from "../_lib/upload-owned-route";

/**
 * The admin attachment transport. It accepts any file type through the
 * application, so an email reply never depends on a provider account or on a
 * provider client in the browser. The returned address is always
 * `/files/<key>`.
 */
export const POST = createOwnedUploadHandler({
  permission: PERMISSIONS.MAIL_READ,
  kind: StoredFileKind.ATTACHMENT,
  maxBytes: ATTACHMENT_MAX_UPLOAD_BYTES,
  noun: "file",
  logTag: "[ATTACHMENT_UPLOAD]",
});
