const { PrismaClient, SocialKey } = require("@prisma/client");

const prisma = new PrismaClient();

async function migrateSocials() {
  try {
    // Aggiorna ogni post aggiungendo l'utente al campo authors
    await prisma.socialChannel.create({
      data: {
        key: SocialKey.PINTEREST,
        url: "",
        entityId: "951017d4-9574-44ca-a5ce-458800ddbad0",
        entityType: "SITE",
      },
    });

    console.log(`Migration completed for pinterest.`);
  } catch (error) {
    console.error("Error migrating pinterest:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateSocials();
