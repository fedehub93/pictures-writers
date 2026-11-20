import { db } from "@/shared/lib/db";

import {
  MEDIA_QUOTA_DEFAULT_MB,
  PUBLIC_ORIGIN_RESERVE_DEFAULT_MB,
} from "@/modules/media/lib/quota";

/**
 * Test support for the singleton Installation settings row. Tests run
 * sequentially (`fileParallelism: false`), and every caller restores the
 * defaults so a quota or reserve set by one test never leaks into the next.
 */
export async function setMediaQuotaMb(quotaMb: number): Promise<void> {
  const settings = await db.settings.findFirst({ select: { id: true } });

  if (settings) {
    await db.settings.update({
      where: { id: settings.id },
      data: { mediaQuotaMb: quotaMb },
    });
    return;
  }

  await db.settings.create({ data: { mediaQuotaMb: quotaMb } });
}

export async function setPublicOriginReserveMb(
  reserveMb: number,
): Promise<void> {
  const settings = await db.settings.findFirst({ select: { id: true } });

  if (settings) {
    await db.settings.update({
      where: { id: settings.id },
      data: { publicOriginReserveMb: reserveMb },
    });
    return;
  }

  await db.settings.create({ data: { publicOriginReserveMb: reserveMb } });
}

export async function resetMediaQuota(): Promise<void> {
  await setMediaQuotaMb(MEDIA_QUOTA_DEFAULT_MB);
  await setPublicOriginReserveMb(PUBLIC_ORIGIN_RESERVE_DEFAULT_MB);
}
