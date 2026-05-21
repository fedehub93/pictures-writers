import { db } from "@/shared/lib/db";

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

    const mappedSingleSends = singleSends.map((s) => ({
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

export const getSingleSendById = async (id: string) => {
  const existingSingleSend = await db.emailSingleSend.findUnique({
    where: {
      id,
    },
    include: {
      audiences: true,
    },
  });

  if (!existingSingleSend) {
    throw new Error("Single send not found");
  }

  return existingSingleSend;
};
