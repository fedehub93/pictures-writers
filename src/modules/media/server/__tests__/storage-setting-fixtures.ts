import { db } from "@/shared/lib/db";

let createdSettingsId: string | null = null;

/**
 * Puts a storage choice on the single Installation settings row, creating the
 * row when the suite is the first to need one. `null` means "no choice saved".
 */
export async function setStorageDriverSetting(
  storageDriver: string | null,
): Promise<void> {
  const existing = await db.settings.findFirst({ select: { id: true } });

  if (existing) {
    await db.settings.update({
      where: { id: existing.id },
      data: { storageDriver },
    });
    return;
  }

  const created = await db.settings.create({
    data: { siteName: "Media storage tests", storageDriver },
    select: { id: true },
  });
  createdSettingsId = created.id;
}

/** Returns the Installation to "no choice saved" and removes a row it created. */
export async function resetStorageDriverSetting(): Promise<void> {
  if (createdSettingsId) {
    await db.settings
      .delete({ where: { id: createdSettingsId } })
      .catch(() => undefined);
    createdSettingsId = null;
    return;
  }

  const existing = await db.settings.findFirst({ select: { id: true } });
  if (!existing) return;

  await db.settings.update({
    where: { id: existing.id },
    data: { storageDriver: null },
  });
}
