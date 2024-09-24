import { db } from "./db";

export async function handleUserSubscribed() {
  const users = await db.user.findMany({
    where: {},
  });

  for (const user of users) {
    await db.notification.create({
      data: {
        userId: user.id,
        type: "USER_SUBSCRIBED",
        message: "È stata effettuata una nuova sottoscrizione!",
      },
    });
  }
}

export async function handleEbookDownloaded() {
  const users = await db.user.findMany({
    where: {},
  });

  for (const user of users) {
    await db.notification.create({
      data: {
        userId: user.id,
        type: "EBOOK_DOWNLOADED",
        message: `È stato eseguito il download dell'ebook!`,
      },
    });
  }
}

export async function handleScriptSubmitted() {
  const users = await db.user.findMany({
    where: {},
  });

  for (const user of users) {
    await db.notification.create({
      data: {
        userId: user.id,
        type: "IMPRESSION_SUBMITTED",
        message: `È arrivata una nuova richiesta di feedback gratuito.`,
      },
    });
  }
}
