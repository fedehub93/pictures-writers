import { ProductType } from "@/prisma/generated/client";
import { db } from "./db";

export async function handleFormSubmitted() {
  const users = await db.user.findMany({
    where: {},
  });

  for (const user of users) {
    await db.notification.create({
      data: {
        userId: user.id,
        type: "FORM_SUBMITTED",
        message: "È stato compilato un nuovo modulo!",
      },
    });
  }
}

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

export async function handleProductPurchased({ type }: { type: ProductType }) {
  const users = await db.user.findMany({
    where: {},
  });

  for (const user of users) {
    await db.notification.create({
      data: {
        userId: user.id,
        type: `${type}_PURCHASED `,
        message: `È stato acquistato un nuovo prodotto!`,
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

export async function handleContactRequested() {
  const users = await db.user.findMany({
    where: {},
  });

  for (const user of users) {
    await db.notification.create({
      data: {
        userId: user.id,
        type: "CONTACT_REQUESTED",
        message: `È arrivata una nuova richiesta dalla sezione contattaci.`,
      },
    });
  }
}
