import { EmailSingleSend } from "@/generated/prisma";
import { db } from "@/lib/db";

type CustomEmailAudience = { _count: { contacts: number } };

export type EmailSingleSendCustom = EmailSingleSend & {
  _count: { emailSingleSendLogs: number };
  audiences: CustomEmailAudience[];
  totalContacts: number;
};

export const getSingleSends = async () => {
  try {
    const singleSends = await db.emailSingleSend.findMany({
      include: {
        _count: {
          select: { emailSingleSendLogs: true },
        },
        audiences: {
          select: { _count: { select: { contacts: true } } },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const mappedSingleSends: EmailSingleSendCustom[] = singleSends.map((s) => ({
      ...s, // Mantieni tutte le proprietà di 's'
      totalSends: s._count.emailSingleSendLogs,
      totalContacts: s.audiences.reduce(
        (total, a) => total + a._count.contacts,
        0,
      ), // Calcola il totale dei contatti
    }));

    return mappedSingleSends;
  } catch (error) {
    console.error("GET_SINGLE_SENDS", error);
    return [];
  }
};

export type GetSingleSends = Awaited<ReturnType<typeof getSingleSends>>[number];
