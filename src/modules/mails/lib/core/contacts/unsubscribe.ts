"server-only";

import { db } from "@/shared/lib/db";
import { EmailProviderAdapter } from "../../types";
import { deleteContactOnProvider } from "./sync";

/**
 * Revoke a contact's consent (`isSubscriber = false`) while keeping the
 * Contact row — consent is revoked, never deleted.
 *
 * The provider sync (contact deletion, kept as today) is best-effort: any
 * failure is logged and swallowed so revocation always succeeds. Idempotent:
 * calling it again on an already-revoked contact is a no-op. Returns `false`
 * when the contact does not exist.
 */
export async function unsubscribeContactById(
  id: string,
  _adapter?: EmailProviderAdapter,
): Promise<boolean> {
  const contact = await db.emailContact.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!contact) {
    return false;
  }

  await db.emailContact.update({
    where: { id: contact.id },
    data: { isSubscriber: false },
  });

  try {
    await deleteContactOnProvider(contact.id, _adapter);
  } catch (error) {
    console.error(
      `[unsubscribeContactById] Provider sync failed for contact ${id}:`,
      error,
    );
  }

  return true;
}
