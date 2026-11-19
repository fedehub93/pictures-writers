import { MediaType } from "@/generated/prisma";

/**
 * The limits the media library enforced while UploadThing owned the
 * transport: images keep 4 MB, every other Media type gets 16 MB.
 */
export const MEDIA_MAX_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MEDIA_MAX_NON_IMAGE_UPLOAD_BYTES = 16 * 1024 * 1024;

export function mediaUploadLimitFor(type: MediaType): number {
  return type === MediaType.IMAGE
    ? MEDIA_MAX_IMAGE_UPLOAD_BYTES
    : MEDIA_MAX_NON_IMAGE_UPLOAD_BYTES;
}
