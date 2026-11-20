import { MediaType } from "@/generated/prisma";

/**
 * The limits the media library enforced while UploadThing owned the
 * transport: images keep 4 MB, every other Media type gets 16 MB.
 */
export const MEDIA_MAX_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MEDIA_MAX_NON_IMAGE_UPLOAD_BYTES = 16 * 1024 * 1024;

/**
 * The admin attachment and avatar transports keep the limits the composer and
 * the profile form enforced before the bytes moved through the application:
 * an attachment may be any file up to 16 MB, an avatar must be an image up to
 * 4 MB.
 */
export const ATTACHMENT_MAX_UPLOAD_BYTES = 16 * 1024 * 1024;
export const AVATAR_MAX_UPLOAD_BYTES = MEDIA_MAX_IMAGE_UPLOAD_BYTES;

export function mediaUploadLimitFor(type: MediaType): number {
  return type === MediaType.IMAGE
    ? MEDIA_MAX_IMAGE_UPLOAD_BYTES
    : MEDIA_MAX_NON_IMAGE_UPLOAD_BYTES;
}
