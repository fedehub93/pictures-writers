import { db } from "@/lib/db";
import { normalizeEmail } from "@/shared/lib/email";
import { isUniqueConstraintError } from "@/shared/lib/prisma-errors";

export const getContactByEmail = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  try {
    const emailContact = await db.emailContact.findFirst({
      // Writes are canonical, so an exact match would look sufficient — it is
      // not. The legacy rows are not canonical: without the insensitive match
      // they become unreachable, and every time those people come back a new
      // canonical row is created while the old one keeps the audience and the
      // provider mapping. Never "simplify" this to `{ email }` without a
      // backfill first.
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      // When the 7 legacy pairs both match, always pick the oldest so future
      // events do not oscillate between the two rows.
      orderBy: { createdAt: "asc" },
    });

    return emailContact;
  } catch {
    return null;
  }
};

export const getContactById = async (id: string) => {
  try {
    const emailContact = await db.emailContact.findUnique({
      where: { id },
    });

    return emailContact;
  } catch {
    return null;
  }
};

export interface NewContactDefaults {
  firstName?: string | null;
  lastName?: string | null;
  /**
   * Consent is separate from identity: capture paths default to `true`
   * (newsletter/product forms), while a correspondent saved from the mailbox is
   * not a subscriber unless they opt in.
   */
  isSubscriber?: boolean;
}

export const createContactByEmail = async (
  email: string | null | undefined,
  interactionType?: string,
  defaults: NewContactDefaults = {}
) => {
  const normalizedEmail = normalizeEmail(email ?? "");

  // `null` is the agreed "no address" signal: no address means no Contact.
  if (!normalizedEmail) {
    return null;
  }

  let contact = await getContactByEmail(normalizedEmail);

  if (!contact) {
    try {
      contact = await db.emailContact.create({
        data: {
          email: normalizedEmail,
          isSubscriber: defaults.isSubscriber ?? true,
          firstName: defaults.firstName,
          lastName: defaults.lastName,
        },
      });
    } catch (error) {
      // Find-then-create is not atomic: two concurrent captures can both miss
      // the lookup and race on the unique index. The loser re-reads instead of
      // surfacing the violation to the visitor.
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      contact = await getContactByEmail(normalizedEmail);
    }
  }

  if (!contact) {
    return null;
  }

  if (interactionType) {
    await addContactInteraction(contact.id, interactionType);
  }

  return contact;
};

export const addContactInteraction = async (
  contactId: string,
  interactionType: string
) => {
  return await db.emailContactInteraction.upsert({
    where: {
      contactId_interactionType: {
        contactId,
        interactionType,
      },
    },
    update: {},
    create: {
      contactId,
      interactionType,
    },
  });
};
